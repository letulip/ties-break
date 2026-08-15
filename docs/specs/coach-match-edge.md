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

     DRAFT IS THE HONEST STATE, not a workaround: §8b's measurement has not run and §6's registered
     prediction is unresolved. A canonical document asserting current truth while its own prediction
     is open would be a worse error than the one it replaced.

     ⚠ IT FLIPS AT THE END OF THIS WAVE, and these are the conditions – whoever closes the wave owes
     this: §6's re-measure recorded against its prediction, §7 shipped, §8 either shipped or ruled
     out by its own numbers. Then `status: current`, `canonical: true`, and a `## Current truth`
     section. This note exists because "flip the frontmatter later" is exactly the shape of the nine
     items the 13.08 audit found silently dropped.

     ⚠ TWO OF THE THREE CONDITIONS ARE NOW MET, and this line is here so the next reader does not
     have to re-derive which: §7 SHIPPED (the reveal names a place – see §7a for the cut and the
     nine sentences) and §8a SHIPPED with it (three bands of confidence – see §8a-shipped). STILL
     OPEN: §6's re-measure against its registered prediction, and §8b's sweep, whose own prediction
     is deliberately unflattering. The frontmatter stays `draft` until both land. -->


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
| hers, before the reveal | ~~`Too early to tell where in that band – 4 weeks of 52.`~~ **replaced by §9** |
| hers, after it | ~~`A season together – the number is +0.62% per match.`~~ **replaced by §7** |

Corridors print to one decimal, because a bracket is a design constant. The revealed line originally
printed two, on the argument that a measurement of one person deserves the digit that separates a
0.62 from a 0.55 – **and that is the sentence §7 threw out**; the pre-reveal line is untouched and
its "where in that band" turned out to be the exact question §7's replacement answers. Neither
sentence judges the man – a low draw is reported in the same words and the same colour as a high one
– and neither mentions her skills, because the whole corridor is under half a skill point against a
visibility floor of 3 (§3).

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

### 6a. Measured – the shipped ladder, 27 cells, 810 careers, 30 seeds (13.08.2026)

`npx vite-node tools/wall-l1-bench.ts -- --arms base,bctl,bedge --seeds 30`. Three arms per cell:
`base` self-coached, `bctl` the same hire with the edge off, `bedge` the same hire with it on – so
`bedge − bctl` is the edge's own product and `bctl − base` is the rest of the coach.

**⚠ BOTH HALVES OF MY PREDICTION FAILED, and one of them was the good news I had already reported.**

**1. Top-100 is no longer a hard zero.** `bedge:middle:middle` and `bedge:wealthy:middle` each put
**one career of thirty** inside #100 – best ranks **#94** and **#91**, against #123 and #106 for the
same girls with the edge off. Slam stays 0.0% in all 27 cells and `clr500` peaks at 6.7%.

⚠ My own pre-registration says a moving top row means the implementation is wrong, so it was checked
rather than explained away. Two things that WOULD show a fault are sound: the realised draws sit
inside their corridors (measured means 0.4521 / 0.6996 / 0.8517 / 0.9979 against 0.45 / 0.70 / 0.85 /
1.00) and a self-coached career is byte-identical to before the slice. The likeliest honest reason
is that the wall's Layer B used each tier's flat MIDPOINT, while the shipped mechanic draws – so a
`middle` coach who rolls near 0.9 is stronger than anything Layer B tested, on top of the coach's
own development multiplier which Layer A never had. **That is the design working, not breaking – but
this paragraph is not proof, and the claim is only that the two obvious faults are absent.**

And the magnitude keeps it honest: those careers' MEDIAN ranks are #147 and #158. The edge grazes
the top hundred for a week; it does not move anybody in.

**2. `wealthy·high` does NOT pay for itself, and my earlier report of that flip was wrong.** On the
shipped ladder it is `prize − bill` **−$39,387 → −$22,782** – better with the edge, still negative.
The +$21k flip I quoted came from the flat-midpoint wall run and does not reproduce here. Corrected
in the record rather than quietly dropped.

**What IS robust, and why it is the paired counts rather than the money.** The prize medians are
noisy at 30 seeds – two cells (`wealthy:budget`, `wealthy:middle`) came back *worse* with the edge,
which cannot be real. The paired better/worse/tie against the same girl self-coached is the stable
read, and the edge adds one to two careers of thirty in every solvent cell:

| cell | `bctl` (hire, no edge) | `bedge` (same hire, edge on) |
| --- | --- | --- |
| middle · budget | 20 / 9 / 1 | **21 / 6 / 3** |
| wealthy · high | 26 / 3 / 1 | **28 / 1 / 1** |
| wealthy · middle | 25 / 4 / 1 | **26 / 4 / 0** |
| working · middle | 6 / 20 / 4 | 7 / 20 / 3 – the bill still ruins it |

**Where it lands, lived** (match-win % by rung, `bctl` → `bedge`, per tier): `middle` w50 71.1 →
**72.2**, w100 71.9 → **73.1**, wta250 28.5 → **28.9**; `high` w100 71.7 → **74.7**, wta250 27.3 →
**30.6**. Small, everywhere, and biggest in the middle of the ladder – the same shape §M5 measured.
⚠ The `elite` rows (wta125 33.8 → 51.6) are NOT evidence of anything: elite is 0% solvent at working
and middle backgrounds, so that pool is a handful of matches from the few careers that survived.

**Verdict.** The edge behaves as designed and buys a small, consistent improvement wherever the
family can afford the coach at all. It does not breach the wall. It does not fix the coach market:
above `budget` the bill still swamps the product at every background but `wealthy`, and `working`
remains ruined by any paid coach. Prices are task #103's problem, exactly as §M4 said.

## 7. The reveal says a PLACE, not a number (owner, 13.08) – SHIPPED

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

The sense of the three bands, as approved:

| where he fell in his corridor | the sense |
| --- | --- |
| upper third | *better than his price* |
| middle | *exactly what his price says* |
| lower third | *the lower end of his bracket* |

None of the three praises or blames – a low draw is reported in the same words and the same colour
as a high one. The design survives intact: a lucky `budget` coach still reads as a find (the top of
his bracket IS a typical `high`), and it still cannot be shopped for.

### 7a. What shipped: the cut, and the nine sentences

**THE CUT IS EQUAL THIRDS OF HIS OWN CORRIDOR**, and the reason is that the draw is uniform inside it
(§2): equal widths are therefore equal probabilities, **one verdict in three, each exactly as likely
as the others**. That is the only cut under which no band is the default answer and none is rare.
The alternative considered and rejected was a wider middle – "about what the price says" as the
usual verdict, the two ends kept for the tails. It fails on §7's own constraint: scarcity is a tone
of voice. A sentence you hear one year in ten reads as an event, and an event about a price is either
good news or bad news, which is the praise/blame the three sentences are written to avoid.

Thirds of HIS corridor, never of the ladder: a third of `budget` is 0.167 pp and a third of `elite`
0.067, because the elite bracket is narrow precisely for the reason §1 gives – an expensive coach is
what you buy when you cannot afford a lottery. The upper third of `budget` still outruns the lower
third of `middle`, so the find is still a find.

**THE PLACEMENT PHRASE POINTS AT THE CARD'S OWN WORDS.** «That band» is the pre-reveal sentence's own
referent, so the two states now read as one question and its answer, two lines under the corridor
they are both about:

> `Too early to tell where in that band – 4 weeks of 52.` → `A season in – it looks like the upper end of that band.`

It is also the phrasing that keeps R15-7 (owner, 09.08: **no pronoun names a coach on this screen** –
`buildCoachRoster` puts a woman on every roster by construction, so «his bracket» prints under Sabine
Kobayashi). The band belongs to the rung anyway, which makes the pronoun-free phrasing the accurate
one as well.

| where he fell | the phrase |
| --- | --- |
| upper third | `the upper end of that band` |
| middle third | `the middle of that band` |
| lower third | `the lower end of that band` |

**Neutrality is mechanical, not a matter of taste**: strip the phrase and the three sentences are
byte-identical, so there is nowhere for an adjective to hide. `tests/coach-edge.test.ts` asserts
exactly that, plus the absence of any evaluative word, of any mention of her game, and of any
pronoun. The line keeps `.cm-plaque`'s single colour in every state – the accent would turn a lower
third into bad news.

The full nine, with the confidence bands of §8a, are the table in **§8a below**.

## 8. Time together – approved for measurement, 13.08

«Да, заводи второй вариант с замером.» Two different things grow with tenure and only one of them is
a balance change:

**8a. The CONFIDENCE of the sentence – free, and true.** One season is a small sample and the copy
should hedge accordingly («it looks like…»); by the third the hedge goes. This is the radar's own
fog applied to a person – confidence grows with observation – and it costs nothing, changes no
number, and makes a long relationship worth something on screen by itself. Ships with §7.

### 8a-shipped. Three bands, at one / two / three-and-on seasons

**THREE BANDS, NOT TWO.** Two would satisfy the letter of the rule (hedge, then no hedge) and would
make the second season show the player nothing – and §8a's whole product is that a long relationship
is worth something on screen *by itself*. Three gives every year until it settles something to
notice. It **saturates at the third**, for the same reason §8b gives for its own curve: the knowledge
of a person is mostly acquired early, and a sentence that kept moving at season eight would be
claiming the family is still learning who he is.

`seasonsTogether = floor(weeksTogether / 52)`, derived in `coachEdgeView` beside the reveal gate –
**the engine owns "how long has he been hers"**, as it already owns "has it been a season".

⚠ **The two halves answer to different clocks, and that is §8's ruling 1 made structural.** The
PLACE follows the MAN (a pure draw off his id, which a fire-and-rehire cannot move); the CONFIDENCE
follows the CLOCK (`coachSinceWeek`, which a fire-and-rehire restarts). So a re-hired coach reads as
*the same man in a new partnership* – same place, hedged again – and never as a different person.
Because the two halves would be trivial to mix up in a component, **the sentence is composed
engine-side** (`coachPlaqueLine`) and the card prints one string and formats nothing.

The nine sentences, verbatim, as shipped:

| | upper third | middle third | lower third |
| --- | --- | --- | --- |
| **1 season** | `A season in – it looks like the upper end of that band.` | `A season in – it looks like the middle of that band.` | `A season in – it looks like the lower end of that band.` |
| **2 seasons** | `Two seasons in, and it holds – the upper end of that band.` | `Two seasons in, and it holds – the middle of that band.` | `Two seasons in, and it holds – the lower end of that band.` |
| **3+ seasons** | `Season after season – the upper end of that band.` | `Season after season – the middle of that band.` | `Season after season – the lower end of that band.` |

The ladder is *a look* → *the look held* → *stated*. The hedge is the only thing that moves: «it
looks like» qualifies a single season's reading; «and it holds» is the same placement arrived at
twice, which is exactly where the extra confidence comes from; by the third the qualifier is simply
gone, and its absence is the certainty. `Season after season` carries no counter deliberately – it
cannot go stale at ten seasons, and the tenure is not a value to be quoted.

**Measured** (same method as §4a – headless Chromium, the app's own `style.css`, real Manrope/Sora
webfonts, real 162x264 portrait, viewports 320 and 375, DPR 2, first ink read with a `Range` rather
than off a box):

* **clearance unchanged: `.cm-art` 62.00px, first ink 75.00px, 12.00px of clearance** on all nine
  sentences at both widths – the same three numbers §4a recorded, so round-18 #2's hard-won gap is
  not spent;
* **every one of the nine wraps to exactly two lines** at both widths and leaves the row at
  **168.86px** – identical to the pre-reveal state. The card does not jump when the reveal lands, and
  does not jump again when the hedge lifts two seasons later;
* that is a budget, not luck: at 320px the two-line ceiling is **60 characters** (61 wraps to three
  and costs 14.17px) and the longest of the nine is 58; at 375px the one-line floor is ~42 and the
  shortest is 45, which is why the third-season line is not shorter than it is.

**And the snapshot no longer carries his number at all.** `Snapshot.coachEdge.realisedPct` is gone,
replaced by `placement`. §7's rule is "no figure for him on any screen"; a field the UI can read is a
rule the next helpful screen can break, so the field went. The engine still derives the value where
it belongs – `coachEdgePp` composes her match player – and hands the surface a place.

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

## 9. The verdict lands in the OFF-SEASON (owner, round-21 #7, 14.08) – SHIPPED

His report, verbatim:

> «У тренера на карточке "Too early to tell 49 weeks of 52" – звучит довольно смешно, сезон уже
> сыгран. Мне кажется надо во-первых заменить на "обсудим в межсезонье", а во-вторых убрать привязку
> к 52 неделям. Если Тренера меняли в первой половине сезона, тогда это актуально, если во второй –
> уже можно готовить "мало времени прошло" или вроде того и сдвигать эту планку дальше по году, может
> у нас сейчас так – надо проверить.»

### 9a. What it did before (checked before anything was built – he asked)

**It did not already work that way.** The gate was `weeksTogether >= COACH_EDGE_REVEAL_WEEKS`, a
rolling 52-week bar off `coachSinceWeek` and nothing else: no season, no calendar and no hire month
appeared anywhere in `coachEdgeView` or `coachPlaqueLine`. A coach taken on in week 2 of a season and
one taken on in week 40 were treated identically, and the pre-reveal sentence printed the bar's
progress – which is how his card came to read «49 weeks of 52» in an off-season with that season
already played, counting down to a Tuesday three weeks into the NEXT year.

### 9b. What ships

`coachRevealWeek(sinceWeek)` returns the **first off-season week** of the season the coach was
present for, and "present for" is his own split: hired in the first half of a season, that season
counts; hired in the second half, it does not and the bar moves a year down the calendar. §4's
"a full season with her" is unchanged in spirit – what changed is that a season is now the tennis
year, judged when it ends, rather than fifty-two weeks off a stopwatch.

The pre-reveal state is **two sentences**, chosen by whether the reveal falls in the season she is in
now. Reading it off the CURRENT season rather than off the hire month is what makes the card move
itself: a coach hired in week 40 shows the far arm all that autumn and switches to the near one when
the new season opens, which is «сдвигать эту планку дальше по году» without a second rule.

| state | copy |
| --- | --- |
| hers, verdict at this season's off-season | `Where in that band – we will know in the off-season.` |
| hers, verdict a season further out | `Where in that band – too soon, ask next off-season.` |

Neither counts anything – **no numeral survives on either arm**, which is §7b – and both keep §7's
referent pairing: the question points at the corridor printed two lines above and the revealed
sentence answers it in the same words. They are 52 and 51 characters, inside the 49-58 the nine
revealed sentences occupy, so both wrap to exactly two lines at 320px and 375px and the card still
does not jump when the reveal lands (§4a's browser measurement).

### 9c. The anti-shopping rule, re-priced

§4 exists so the market cannot be read by hire-look-fire. One read used to cost a flat 52 weeks; it
now costs **24 at the cheapest** (hired at season-week 25, revealed at 49) and **75 at the dearest**
(hired at season-week 26). The trade is accepted because the price stops being something the player
can pay at will: the reveal is pinned to a week of the CALENDAR, so a hire timed one week late costs
a whole extra year, and what it buys is still a third of a corridor and never a number.

`Snapshot.coachEdge.revealAfterWeeks` is therefore replaced by `revealWeek` – an absolute week, and
an off-season one. `tests/component/round21-coach.test.ts` holds all of it, mutation-verified.
