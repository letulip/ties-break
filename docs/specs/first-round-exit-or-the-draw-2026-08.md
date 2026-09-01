# Is the first-round exit real, or is it the draw? – the W50/W75 replay, 27.08

**Asked by the owner, 27.08:** «возьми пожалуйста вот этот сейв и сыграй в нем первую связку
ближайших турниров w50 и w75 после зимы, начинай с полного кондишна (как делал я) 100 раз … Я хочу
понять у нас есть реально разброс в результатах или это всё фикция и 100 из 100 она вылетает в обоих
турнирах сразу на 1м матче».

**Runner:** `tools/first-pair-replay.ts` (new, measurement only – changes no engine number, ships no
fixture). **Save:** his own export at week 257, passed at run time, never copied into the repo.
**Engine:** `wave/the-shop` @ `23eff19`.

**Enlarged the same day**, after he asked for the lever bench rather than the condition arm alone:

> «значит в тесте хорошо бы не только кондицию менять но и наличие или отсутствие тренера на
> поездке, наличие или отсутствие массажиста. Что у нас еще есть? т.е. вот реально собрать бенч из
> "одна точка старта, разные условия, один и тот же турнир" и понять реальную взаимосвязь.»

**The answer in one line: there is real spread, his outcome is a 2–4-in-100 draw rather than the
rule, reloading can never change it – and the game is NOT on rails: his decisions move the result,
though only two of them move it much.**

**Is it rails? No – but the honest answer has a shape.** Of every lever a player owns before a
tournament, **only the COACH family moves results at all** (sending him changes 35 outcomes in 300,
firing him 30, dropping a rung costs a reliable −2.0pp). **The whole CONDITION family – the masseur,
the training plan, the physio and his own restore ritual – moves her condition by up to fourteen
points and moves the tennis by nothing**, because `conditionMatchFactor` is flat above 70 and she
never arrives below it. §5 is the table, ranked, and that last sentence is the one finding here that
reads like a defect rather than a consequence.

---

## 0. His experiment cannot answer his question, and that is not a bug

Load → restore → play → reload is a **replay, not a sample**. `CLAUDE.md` §2: every stream is
seeded, the MAIN position is persisted per career (`rngMain`, v35) so a load *resumes* rather than
re-rolls, and the bracket runs on the event's own sub-stream `seed:kidtour:<event.id>`. The same
save played the same way is the same world for ever. **100/100 identical is the input-independence
law working**, and it is a fairness property – if reloading could rescue a draw, the save button
would be a cheat code.

So the run below is three things, not one: [A] his experiment verbatim, to prove the law holds;
[B] the distribution he is actually asking about; [C] the lever he pulls.

## 1. Her, and the two events

| | |
|---|---|
| seed / week / schema | `alice-cfbv` · 257 · v63 |
| condition on the save | **66** |
| skills | serve 54.5 · ret 59.6 · composure 67.5 · stamina 57.8 · groundstrokes 55.0 |
| `power()` – the five-skill mean the field and the storey bands are denominated in | **58.88** |
| ranks | ITF #62 · domestic #105 · **WTA #106** (drifts to #119–120 by the playing weeks) |
| entries on the save | none |

⚠ **The storey claim in circulation is in the wrong currency.** "Her non-composure core is 56.7,
the floor of the `elite` storey [56, 66]" compares a four-skill mean against bands that
`fieldPros.ts` draws **all five** attributes around, and that `power()` has read as five skills
since 18.08. In the field's own currency she is **58.88 – 29% up the elite band, not at its floor**.
The sharper way to say it: **by SKILL she is an elite-storey pro (ranks #65–94); by POINTS she is
#106, a contender-storey position.** She is under-ranked relative to her strength, and everything
below follows from that one gap.

**The calendar picks the events, not a guess.** Her season array runs weeks 260–308, so weeks
257–259 are the winter break the owner means. W50s ahead: **261**, 266, 270, 273, 279, 282.
W75s ahead: **262**, 270, 275, 282, 287, 295.

- **The first pair after the winter is `5-w261-w50` (hard) and `5-w262-w75` (hard).**
- The pair proposed to me was w266 + w270 – that is the **second** of each.

Both were run, and the second pair matters: **`5-w266-w50` + `5-w270-w75` reproduces his complaint
exactly (0 matches won at both), and the first pair does not (0 and 2).** So the events he played
were almost certainly w266 and w270, and the numbers below lead with that pair.

## 2. [A] – the determinism check

His experiment verbatim: decode the same file, set condition to the max at load, enter both, play
through the real `tickWeek`. N = 10, both pairs.

| pair | W50 | W75 | replays identical |
|---|---|---|---|
| w266 + w270 (**his**) | 0 wins, R1 v `fp-257` | 0 wins, R1 v `fp-100` | **10/10** |
| w261 + w262 | 0 wins, R1 v `fp-347` | 2 wins (QF) | **10/10** |

⭐ **And the card was not lying to him.** `previewEvent.firstMatchChance` – the ring on his own
tournament card, `fastMatchProbability` against the one player the shipped draw gave her – read
**85.0%** at w266 and **85.3%** at w270. He was told he was a heavy favourite at both, twice, and
lost both openers. **That is a 1-in-45 afternoon**, and it is the whole reason the suspicion is
reasonable rather than paranoid. It is also why the naive experiment is so misleading: reloading
replays the same 1-in-45.

And his draws were unremarkable: across the 100 alternative draws the card's number averages **88.7%
at w266** and **83.6% at w270**, so he got a slightly harder-than-average opener at one and a
slightly easier one at the other. He was not handed a monster. He simply lost two matches he was
supposed to win, which is what an 85% favourite does about one afternoon in forty-five.

✓ **No stream is leaking.** One distinct pair of brackets per configuration, hashed over the whole
bracket rather than her line alone. Reloading cannot rescue a draw, and nothing further should be
read into "it reproduced several times".

## 3. [B] – the distribution, N = 100

**How the draw was varied without varying her.** The obvious knob, `world.seed`, is the wrong one:
`fieldProsOf` derives the entire 1,600-strong professional field from it and her own
injury/physio/growth sub-streams are keyed off it, so turning it re-deals the opposition *and*
re-rolls her week. Instead the runner perturbs **one string – the event's `id`** – which is the
sub-stream key the bracket reads (`seed:kidtour:<event.id>`). Trial 0 leaves the id alone and must
reproduce the shipped run; it does.

**It is not argued, it is measured.** Every trial hashes the professional field, her five skills and
her three ranks at the moment the bracket is dealt:

```
invariance receipt – distinct across 100 trials:
  professional field 1 · her skills 1 · her three ranks 1 · BRACKET 100      (want 1/1/1/100)
```

⚠ **One honest exception, and it is a property of his experiment rather than of the tool.** In a
*pair* walk the SECOND event inherits the first: how far she went at the W50 changes her match load
and her points, so at the W75 the receipt reads `skills 4 · ranks 4` instead of `1 · 1`. The W75 was
therefore also run **alone** (`--only w75`), which restores 1/1/1/100. The two agree to within a
point (paired 22.3% vs solo 23.0% opener losses), so the coupling is real but small.

### His pair, at full condition

| | W50 w266 (hard) | W75 w270 (clay) |
|---|---|---|
| **lost the opener** | **11%** | **15%** |
| lost in R16 | 11% | 17% |
| lost in QF | 10% | 17% |
| lost in SF | 9% | 11% |
| runner-up | 11% | 24% |
| **won the title** | **48%** | 16% |
| mean matches won | 3.42 | 2.60 |
| her rank / R1 opponent's median rank | #119 / **#282** | #117 / **#210** |
| R1 opponent ranked above her | **0.0% of 100 draws** | **0.0% of 100 draws** |

**Joint – his actual question: she loses the opener at BOTH in 2 of 100 draws.** At exactly one, 22.
At neither, 76.

### The first pair, at full condition

W50 w261: 10% opener · 43% runner-up · 22% titles · mean 3.30 · R1 opponent median #280.
W75 w262 (solo arm): 21% opener · mean 2.14 · R1 opponent median #210. **Joint both-openers: 0/100.**

### A cost worth naming

At the first pair, **6/100 trials at condition 66 and 1/100 at full never reached the W75 at all –
a severe injury contracted at the W50**. A deep run at the first event is not free, and the
frequency roughly sixfolds when she arrives tired.

## 4. [C] – the lever he pulls, and a correction

⚠ **`conditionMatchFactor(66)` is `0.9743`, not `0.936`.** With `matchStrengthKnee: 70` and
`matchStrengthFloor: 0.55`, `0.55 + 0.45·(66/70) = 0.9743`; **0.936 is the value at condition 60.**
So the restore is worth **+2.64%**, not +6.4% – and in the run itself she plays at 67 (the physio's
+1 lands before the bracket), i.e. **+1.97%**.

What it buys, his pair, 100 draws each:

| | condition 67 | condition 100 | Δ |
|---|---|---|---|
| W50 w266 – lost the opener | 13% | 11% | −2 pts |
| W50 w266 – mean matches won | 3.23 | 3.42 | +0.19 |
| W75 w270 – lost the opener | 17% | 15% | −2 pts |
| W75 w270 – mean matches won | 2.34 | 2.60 | +0.26 |
| **both openers lost** | **4%** | **2%** | **−2 pts** |

**About a quarter of a match, and it halves an already-small joint failure rate.**

⭐ **And for the pair he actually played, the ritual is inert.** Run from the save with condition
left at 66, she still takes the court at **100.0 at both w266 and w270** – nine weeks of winter and
rest have already floated her to the cap. The restore changes nothing there. It bites only on the
*first* pair, where without it she plays at 90 and 87 – and even then the results are unchanged
(0 and 2 wins either way).

## 5. The lever bench – «одна точка старта, разные условия, один и тот же турнир»

**The stake, in his words, is whether the game is on rails.** One save, one tournament, the same 100
draws in every arm, one thing changed at a time. Run with `--levers`.

**Every lever a player owns before a tournament was enumerated from `kidMatchPlayerFor` – the
composition point where she is actually built for the court – and from `accrueCondition`, which is
the only other road into a match:**

| lever | reaches the match by | her setting on this save |
|---|---|---|
| arrival condition | `conditionMatchFactor`, scaling all five attributes | 66, floats to 100 by the playing week |
| the coach's rung | `coachMatchEdge`, added to her serve | `middle-2` |
| **the coach travelling** | the same edge, **doubled** | **`coachOnEventWeeks: false` – he stays home** |
| the kit's wear | `applyKit`, which can only take attributes down | pro grade, but strings 173 weeks old |
| the masseur | `accrueCondition` only – hence through condition | **not hired** |
| the physio retainer | `accrueCondition` only | active |
| the training plan | `accrueCondition` (and growth) only | train 75 / rest 25 |

⚠ **Three of these have exactly one road into a match, and it is condition.** So the bench leaves
condition free-running rather than pinning it: pinning would zero the only channel the masseur, the
physio and the plan have, and manufacture a null result for them.

⚠ **The confound check.** Every arm walks the same 100 event-id nonces, so the draw is paired: nonce
t042 deals the same field to every arm. The bench hashes each arm's sorted R1-opponent list against
baseline's and prints `draw same?`. **It read `yes` for every arm at every event** – no lever moved
who she met, so nothing below is a field effect wearing a lever's name.

⚠ **And the sensitive statistic is the paired one, not the rate.** With 100 samples a rate cannot
resolve a lever worth a fraction of a point. Asking each of the 100 draws "did this change what
happened HERE?" can, so the bench reports **openers flipped** and **results moved**, and those are
the columns to read.

### Two corrections the bench forced on itself

- **`elit-N`, not `elite-N`.** The first draft's elite-coach arm used `elite-2`; `coachById` returns
  null for an unknown id, so the arm silently measured a **fired** coach while claiming to measure
  the best in the game. The `edge` column caught it – it read `0.00`, exactly like `coach-fired`.
  The ladder is now all counterpunchers (`budget-1` / `middle-2` (hers) / `high-2` / `elit-4`), so
  `coachFactor`'s style-fit term is held while the rung moves.
- **The kit lever is WEAR, not grade.** `applyKit` takes a `KitWear`; the grade only sets how long a
  line lasts. Her kit is long past its life and pinned at maximum wear, so re-grading alone barely
  moves. Checked directly against `kidMatchPlayerFor` rather than inferred from a null arm: worn
  serve 53.425 / ret 57.928 → fresh 53.537 / ret 58.509, and an absurd "5,000 weeks old" returns the
  saved values byte-for-byte, which is the clamp showing itself.

### The effect table

Three events, 100 paired draws each, ranked by **how many of the 300 results the lever moved at
all** – the sensitive statistic, because a 100-sample rate cannot resolve a lever worth a fraction
of a point but a paired comparison can. `Δpp` is the change in "wins her opening match", averaged
over the three events. Baselines: **90.0% / 89.0% / 84.0%** at w261 / w266 / w270.

| rank | lever | results moved | mean Δpp | mean Δ rounds | consistent sign? |
|---|---|---|---|---|---|
| 1 | **elite coach AND he travels** | **49 / 300** | −1.0 | +0.08 | no |
| 2 | **send HER coach on the trip** | **35 / 300** | −0.7 | +0.05 | no |
| 3 | **fire the coach** | 30 / 300 | −1.0 | −0.05 | **yes, down** |
| 4 | let the kit rot (re-grade to alloy) | 19 / 300 | −1.0 | −0.04 | **yes, down** |
| 5 | **drop to a budget coach** | 15 / 300 | **−2.0** | −0.06 | **yes, down** |
| 6 | an elite coach who stays home | 9 / 300 | −0.3 | 0.00 | no |
| 7 | a high-tier coach who stays home | 3 / 300 | 0.0 | 0.00 | no |
| 8 | **arrive at full condition (his own move)** | **2 / 300** | **0.0** | +0.02 | – |
| 8= | train 25 / rest 75 | 2 / 300 | 0.0 | +0.02 | – |
| 10 | **hire the masseur and take him along** | **1 / 300** | **0.0** | +0.01 | – |
| 11 | **buy new kit** | **0 / 300** | 0.0 | 0.00 | – |
| 11= | train 100 / rest 0 | 0 / 300 | 0.0 | 0.00 | – |
| 11= | drop the physio retainer | 0 / 300 | 0.0 | 0.00 | – |

### ⭐⭐ Why the whole bottom half is dead, and it is one line of arithmetic

**`conditionMatchFactor` has a knee at 70, and above it the factor is exactly 1.0.**

The condition levers are *not* disconnected – the bench proves they work, by watching the `arrive`
column move at w261, where she has not yet floated to the cap:

| arm | condition she arrives at | results moved |
|---|---|---|
| drop the physio | 86 | 0 / 100 |
| train 100 / rest 0 | 87 | 0 / 100 |
| **baseline** | **90** | – |
| train 25 / rest 75 | 93 | 1 / 100 |
| hire the masseur | 96 | 1 / 100 |
| restore to full | 100 | 2 / 100 |

**The masseur really does buy her six points of condition. The plan really does buy three. His
restore really does buy ten. And 86, 90, 93, 96 and 100 all sit above 70, where the curve is flat –
so not one of those points reaches the match.** The machinery is wired; the transfer function
flattens before the match can see it. At w266 and w270 it is even starker: nine weeks of winter and
rest have already put her at 100 in *every* arm, so the entire family has nothing left to move.

**So: is it rails? No, and here is the shape of the no.**

1. **Decisions do move results.** Sending her coach changes what happens in 35 of 300 draws; firing
   him, 30; an elite coach on the trip, 49. These are not zeroes and the confound check says they
   are hers, not the field's.
2. **But the only reliably-signed effects are DOWNGRADES.** Dropping to a budget coach costs **−2.0
   percentage points of her opening match at every one of the three events**. Nothing she can BUY
   has a consistent positive sign at this sample size – the coach-travel arms move plenty of results
   but scatter (−3.0 / +0.0 / +1.0 pp). Her coach is worth defending; a better one is not clearly
   worth buying, at these events.
3. **The reason is headroom, not rails.** Her baseline is 84–90% to win the opener. There is almost
   nothing above her to buy, which is a fact about her being over-qualified for these rungs (§6),
   not about the levers being fake.
4. **The condition family is inert for a specific and fixable reason** – the knee at 70. That is the
   one line in this whole document that reads like a defect rather than a consequence: a player who
   buys a masseur, rests instead of training, and restores before a trip has bought **fourteen
   points of condition and zero points of tennis**, and the game gives him no way to know that.

## 6. Does it look like reality?

The owner's standard: «если наша проделанная работа и результаты похожи на реальность – то всё в
порядке. Если нет – вот здесь надо думать.»

**CITED.** `docs/research/the-upset-rate.md` §3, the "live + spread" column – this repo's own
synthesis, and the file is explicit that it is model output rather than a frequency count, with the
era of the underlying sources named as its largest uncertainty:

| pairing | cited upset rate | our measured opener loss |
|---|---|---|
| **#100 v #300** → our W50 (#119 v #282) | **19.2%** | **11%** at full, 13% at 66 |
| **#100 v #200** → our W75 (#117 v #210) | **28.9%** | **15%** at full (w270); 21% (w262, solo) |

**Also cited, from the engine's own constants:** `w50.acceptsRank 330` / `entrantPctBand
[0.145, 0.52]` and `w75.acceptsRank 300` / `[0.105, 0.42]`. Those bands open somewhere around
#240 and #190 of the merged professional table, which is exactly where the measured opponents sit.
**She at #106–120 is above both bands.** She is not in the field these rungs are drawn for; she is a
strong outside entrant who gets in on the acceptance list.

**REASONED, not cited.** That a genuine #120 entering W50s would be a heavy favourite and would win
a large share of them is a judgement, not a sourced figure – I found no published table of round
distributions by rank for the W-series, and `the-upset-rate.md` §5 records the same search failing.
So the *shape* of the round distribution (48% titles at a W50) has no cited counterpart. What is
cited is the **R1 pairing only**, above.

**The verdict, split honestly:**

1. **Direction and order: right.** The W75 is harder than the W50, on the same player, in the same
   week block – 15% vs 11% opener losses, mean 2.60 vs 3.42 matches. A player above the entry band
   of both rungs cleans up at the lower one. That is what should happen.
2. **Magnitude: our favourites are too safe.** At both rungs our opener-loss rate sits **below** the
   cited curve – 11% against 19.2%, 15% against 28.9%. If anything the engine should be upsetting
   her *more* often than it does. That is the half that "надо думать", and it points at the match
   engine's favourite dominance, not at the draw.
3. **His specific experience is a tail, not the rule.** Two openers lost at his pair is a **2-in-100
   draw at full condition, 4-in-100 at 66**. It reproduced every time because it is the same seeded
   draw every time – not because it is what usually happens.

## 7. Plainly, for the owner

- **There is real spread.** Rounds reached span every value from "lost the opener" to "won the
  title" at both events, with 31 and 30 distinct first-round opponents across 100 draws.
- **It is not visible from a save file.** Reload as often as you like: same world, by law. Only a
  different draw is a different sample, and only time gives you one.
- **A first-round exit is NOT the expected case for this player at these two events** – it is
  11–17%, and losing both is 2–4%.
- **She should be doing better here than she is at these rungs, not worse.** At #106 with an
  elite-storey build she is over-qualified for W50 and W75; the interesting question is why her
  POINTS say #106 while her SKILL says top-90, not why she lost two openers.
- **The game is not on rails, but it is close to a ceiling.** His decisions do move results – firing
  the coach changes 30 outcomes in 300, sending him changes 35. What they cannot do is push a
  number that already reads 84–90%.
- **⚠ One thing genuinely wants a decision, and it is the only line here that reads like a defect.**
  The masseur, the training plan, the physio and his own restore ritual all move her condition –
  by 6, 3, 4 and 10 points respectively, measured – and **not one of them moves a match**, because
  `conditionMatchFactor` is flat above 70 and she never arrives below it. Everything he buys in that
  family is currently theatre at this stage of a career. Either the knee moves, or the card should
  stop implying that arriving fresher is worth something when it is not.

## Open, for him to rule on

1. **The condition knee at 70.** Inert for a player who rests through a winter. Lower it, curve it,
   or say out loud that condition is a *durability* lever rather than a *strength* one above 70.
2. **Points versus strength.** Her build is elite-storey; her ranking is contender-storey. That gap
   is what makes W50/W75 easy for her and is worth its own measurement.
3. **Our upsets are rarer than our own research says.** §6, point 2 – a match-engine question, not a
   draw question.

## Reproduce

```bash
npx vite-node tools/first-pair-replay.ts -- --save <his.tsave> --trials 100 --replays 10 --pair second
npx vite-node tools/first-pair-replay.ts -- --save <his.tsave> --trials 100 --replays 10 --pair first
npx vite-node tools/first-pair-replay.ts -- --save <his.tsave> --trials 100 --replays 10 --only w75
```

Two identical invocations were diffed and are byte-identical apart from their own label line.
