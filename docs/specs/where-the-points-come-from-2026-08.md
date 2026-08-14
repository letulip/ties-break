---
type: spec
status: draft
area: engine/balance
canonical: false
last-reviewed: 2026-08-14
---

# Why the weaker girl ranked higher, and it is not luck (14.08.2026)

The owner, after the per-round win rates: «почему при этом всём Оливия пришла к 21, а Наоми только
к 26? Удача?»

Not luck. **Access.** `npx vite-node tools/counting-window.ts -- --save <file>` opens the eighteen
slots a professional ranking actually is and reads where each point came from – a match won, or a
first match lost.

## 0. ⚠ First, a mis-attribution of mine to correct

I reported the nine-entry WTA 500 season as **Naomi's**. It is **Olivia's**. The 23.1% first-round
rate quoted beside it is Olivia's own, so the arithmetic held; only the name did not.

⚠ And I then mis-stated the correction itself: I told the owner that round-18's ledger carried the
same error and needed fixing. **It does not.** `docs/rounds/round-18.md:3` names
`tennis-sim_olivia-o1p7_w413.tsave` in as many words. The error was mine, in what I said to him,
and it never reached a document. §7 of that ledger is the direct ancestor of this spec – it is
where the 130× ratio between a Slam opener and a 500 opener was first written down.

## 1. The two careers, at the week he asked

| | Naomi, w621, age 25 | Olivia, w413, age 21 |
| --- | --- | --- |
| rank | **#106** | **#51** |
| counted points | 856 | 1311 |
| **matches won in the counted eighteen** | **59** | **26** |
| from winning | **856 (100%)** | 466 (36%) |
| from showing up | **0 (0%)** | **845 (64%)** |
| Slams in the window | **0** | 4 – all four first-round losses |
| WTA 1000s in the window | **0** | 7 – five of them first-round losses |

Olivia is ranked fifty-five places above Naomi. She won **less than half** as many matches to do it.
Nine of her eighteen counting slots are matches she lost, and a tenth is a zero for a mandatory she
skipped.

The counterfactual, re-folded through the game's own merged table:

| | Naomi | Olivia |
| --- | --- | --- |
| as she stands | #106 | #51 |
| if a first-round exit paid nothing | **#106 – unchanged** | **#157** |
| if ONLY first-round exits counted | #1296 | **#103** |

Olivia's participation points **alone** rank her #103 – within three places of where Naomi arrived
after winning fifty-nine matches.

## 2. The mechanism, and it is a cliff at a rank cut

Above WTA 250 a first-round exit pays real ranking points, and entry to those rungs is an absolute
rank cut. On Naomi's own table at w621:

| rung | accepts to | a first-round exit pays | reserved slots | free points |
| --- | --- | --- | --- | --- |
| slam | **#104** | **130** | 4 | 520 |
| wta1000 | **#65** | **65** | 7 | 455 |
| wta500 | #120 | 1 | – | – |
| wta250 | #200 | 1 | – | – |

**A full reserved book, every single first match lost: 975 points.**

And the table she was standing on:

```
  #50   1312 pts
  #65   1204 pts   <- the WTA 1000 cut
  #104   877 pts   <- the Slam cut
  #106   856 pts   <- Naomi, after 59 wins
```

**She was twenty-one points short of the Slam cut.** Twenty-one. Past it, four first-round losses
are worth 520 – and 975 with the 1000s, which is more than the 856 she earned by winning fifty-nine
matches. The ladder has a step in it that play cannot substitute for, and the step is self-holding:
the points you get for being admitted are what keep you admitted.

**This is not a hypothesis about her career, it is what happened to it.** Between w621 and w674 –
one season – Naomi crossed. She is now **#15**: 3 Slams and 3 WTA 1000s in the window, 1580 points,
of which 325 are three first matches lost. She did not become a different player. She got in.

## 3. Where the number came from, and the guard that missed it

Not an oversight – a **known normalisation whose consequence was never priced**.
`calendar.ts` says it out loud on `slam.drawSize`: *"the points row above is still normalised to 32
rows"*. The research prints the real WTA column, and the real Slam draw is 128. Our draw is 32. So
our first-round loser is paid what the real tour pays a player who has **already won two matches**
to reach the last 32. A real Slam first-round loss pays 10. Ours pays 130. Same for the 1000s: real
draw 96, real opening loss 10, ours 65.

The guard exists and is aimed one rung too low. `tests/wave-b-points.test.ts:104-111` names the
exception explicitly – `REAL_OPENER_TIERS = { wta1000: 65, slam: 130 }` – and argues the
participation floor "cannot come back through them", on three grounds:

1. *"a top-50 player is admitted to at most 12 of these a season"* – true, and twelve times their
   floor is **975 points**, which is the entire finding. The count was stated; the product was not
   taken.
2. *"they sit behind #65/#104 cuts"* – that is the cliff, not a defence against it.
3. *"one W50 semi-final still out-pays a whole best-16 window of W15 openers"* – compares W15
   openers with a W50 semi. **A Slam opener is never compared with anything.**

The pinned assertion (`windowedBestSum(..., 18) < w50.points[2]`) folds 1-point exits, so it passes
at 18 and would pass at any width. It measures the rung where participation is already free.

## 4. The money is the bigger half, and it says the same thing

The owner, 14.08: «я и чувствую, что у нас как-то слишком быстро всё происходит». A ranking is
capped at eighteen slots; a bank account is not. Same split, every row in the window:

| career | prize money, 52 weeks | for winning | **for showing up and losing** |
| --- | --- | --- | --- |
| Olivia, 21 | $1,095,950 | $107,950 (10%) | **$988,000 (90%)** |
| Olivia, 22 | $1,158,250 | $536,250 (46%) | **$622,000 (54%)** |
| Naomi, 26 | $1,062,550 | $587,050 (55%) | **$475,500 (45%)** |

Olivia's season 7 record is **31-26**. She banked **$1,367,573** and finished the year world **#33**.

The prize column is normalised exactly as the points column is: our Slam floor pays $190,000, which
is real-tour R32 money (~$215k), not real R128 money (~$110k). One decision, two currencies.

## 5. ⚠ THE POPULATION ARGUMENT IS DEAD. I REPEATED A STALE COMMENT AND THE OWNER CAUGHT IT.

He asked: «а что значит "поля не хватает"? У нас же есть игроки вроде, мне казалось, что шлем на то
и шлем, что там широкий список начинает играть и самоотсеивается, разве в реальности не так?»

He is right, and `tools/big-draw-cost.ts` – which exists precisely for this – says so. 3 worlds ×
208 weeks, the Slam rung, every candidate draw size:

```
  draw   of-age in world    in-band   drawn   out-of-band   under-age   youngest   ms/bracket
    32            1674.1     326.5    32.0          0.0%        0.0%         17         0.13
    64            1674.1     326.5    64.0          0.0%        0.0%         17         0.25
   128            1674.1     326.5   128.0          0.0%        0.0%         17         0.51
```

**A 128-draw Slam costs 0.51 ms and fills with zero backfill, zero under-age players, none from the
live cohort of children.** 326 in-band candidates against a draw of 128.

The comment I quoted (`calendar.ts` on `slam.drawSize`) is TRUE OF WHEN IT WAS WRITTEN and stale
since **04.08**: the canonical bracket was live-only then, so a 128-draw meant 128 of 199 children.
W3-FIELD3 put 1600 derived professionals into that draw while keeping them out of `world.results`.
The tool's own header says the answer changed; I read the calendar comment instead of running it.

## 6. What is actually on the table

The three options are **not independent**, which is the thing my first version of this section got
wrong.

Real 2026 WTA columns, in full – ours is the first six values of each:

| | W | F | SF | QF | R16 | **R32** | R64 | **R128** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Slam (128 draw) | 2000 | 1300 | 780 | 430 | 240 | **130** | 70 | **10** |
| WTA 1000 (96 draw) | 1000 | 650 | 390 | 215 | 120 | **65** | 35 | **10** |

So the owner is right that a 1000 pays decently for an early exit – but 65 is R32 (two matches won)
and 35 is R64 (one). The genuine first-round loss is **10 at both**. And the 130 is real *because*
the draw is 128; getting to the last 32 is work. Every real 32-draw event in the rulebook – WTA 500,
WTA 250 – pays about **1** at the door, which is what our own 500 and 250 already pay.

* **(a) Leave it.** The cost is measured above and the owner has already rejected it.
* **(b) Pay the rulebook's opener: 10 and 10.** Owner-approved 14.08: «вполне можно, не вижу причины
  делать иначе». Priced on his own four saves, re-folded through the real merged table:

  | career | as she stands | at 10/10 |
  | --- | --- | --- |
  | Naomi, 25 | #106 | **#106 – does not move.** She had no participation points at all |
  | Naomi, 26 | #15 | **#55** |
  | Olivia, 21 | #51 | **#143** |
  | Olivia, 22 | #33 | **#82** |

  ⚠ The counterfactual is close to exact rather than indicative: the professional field is DERIVED,
  its points come from a points-to-rank curve rather than from played results, so re-pricing an
  opener cannot move the ladder she is climbing.

  ⚠ **AND ON A 32-DRAW IT LEAVES AN ARTEFACT.** The column becomes `[2000, 1300, 780, 430, 240, 10]`
  – winning ONE match multiplies her by **24**. Reality has no such step because reality has the
  rounds in between (240 → 130 → 70 → 10). Only (c) removes it.
* **(c) Restore the rounds: 128 and 96.** Now measured as affordable (§5). It is the only option
  that makes the 130 mean what it means, and it is the one that answers «слишком быстро» directly:
  seven rounds to a Slam title instead of five, and 10 points for turning up.

  Its real costs, none of them population: she would play up to **7 matches in one week** where our
  tournament is one week and a real Slam is two – so condition, fatigue and injury exposure all
  need re-measuring; the Draw view must render 128; the prize column needs its own R64/R128 rows;
  and every rank-denominated number (`acceptsRank`, `entrantPctBand`, the acceptance cuts) shifts.

**Recommended: (b) now, (c) as its own wave.** (b) is one constant per rung, reversible, already
priced, and it stops the bleeding this week. (c) is the real fix and is no longer blocked by
anything measured – it is blocked only by the size of the wave.

## 7. (b) SHIPPED 14.08 – and what it did to whole careers, not just to saves

`slam.points` and `wta1000.points` last element → **10**. Two constants, `calendar.ts`.

⚠ **A SAVE CANNOT MEASURE THIS AND THE COUNTERFACTUAL IN §6 IS NOT THE WHOLE ANSWER.**
`world.results` stores the points a row was AWARDED; nothing re-derives them from the table on load.
So his four careers keep their old figures and converge only as the 52-week window turns over – the
correction lands over a season, not on load. And a save cannot show the SECOND-ORDER loop at all:
access is a rank cut, so fewer points can shut a door that fewer points alone did not.

`tools/opener-price-bench.ts`, 8 careers × 520 weeks, both arms on identical seeds, worlds, talent,
policy and RNG – the only difference is what an opening loss pays:

| seed | before | after | funds before → after |
| --- | --- | --- | --- |
| opener-0 | #151 | #139 | $583k → $587k |
| opener-1 | #151 | **#151** | identical |
| opener-2 | #297 | **#297** | identical |
| opener-3 | #174 | **#174** | identical |
| opener-4 | **#20** | **#64** | $2.13M → $1.97M |
| opener-5 | #153 | **#153** | identical |
| opener-6 | #16 | #18 | **$6.49M → $4.84M** |
| opener-7 | unranked | unranked | identical |

**Five of eight careers are byte-identical.** They never reached the big draws, so the change cannot
touch them – which is exactly the blast radius it should have. It bites only where the free points
were, and hardest on the girl who was living on them: opener-4 loses 44 places.

**The ladder still works.** Median #151 → #151, top-100 2/8 → 2/8, ranked 7/8 → 7/8. Nobody is
locked out and nothing collapsed.

**The access loop is real and mild**: 22 big-draw entries before, 19 after (86%). Fewer free points
→ slightly lower rank → slightly less access. A loop, not a spiral.

**The money moved where he wanted it.** Median funds unchanged, but the two who reached the top
banked less – $6.49M → $4.84M and $2.13M → $1.97M. That is «слишком быстро» being answered in the
currency he raised it in.

⚠ **ONE HONEST LIMIT OF THE BENCH'S OWN COLUMNS.** `bigEntries` counts rows in the PRUNED 52-week
window at the end of the run, not over the career – so opener-0 reads "0 big entries" in both arms
while still diverging (#151 vs #139, 22 matches won vs 26). She met the change earlier and the
column cannot see when. Read the entry counts as an end-state sample, not a career total.

## 8. (c) SHIPPED THE SAME DAY – the draws are 128 and 64

«доделывай пожалуйста». Both rungs now run their real draw, and **every number in both points rows
is published rather than adapted**:

| rung | draw | points |
| --- | --- | --- |
| slam | **128** | 2000 / 1300 / 780 / 430 / 240 / **130** / **70** / **10** |
| wta1000 | **64** | 1000 / 650 / 390 / 215 / 120 / **65** / **10** |

The two rows the rulebook's own 32-row chart does not print were **sourced, not invented** – that
was the last live objection in `calendar.ts` and it was a real one. Two independent publications
agree cell for cell; recorded with URLs in `docs/research/ranking-points-by-tier.md` §4b.

⚠ **AND THE 1000 IS 64 RATHER THAN 96 FOR A SOURCING REASON, NOT A CONVENIENCE ONE.** The tour runs
1000s at both sizes. `runTournament` is a pure single-elimination fold with no bye machinery, so a
real 56-draw IS a 64-bracket here – and the 56 column is the one the rulebook prints all the way
down. Mapping it costs nothing adapted or interpolated. A 96 would have had to be squeezed into 128
with a borrowed R128.

**Prize money for the new rounds is derived, and the derivation is stated**, because our six shipped
figures are flatter than every real major's ladder: each new round takes a real event's SHAPE at
that step and applies it to OUR neighbour. Slam R64 $124,000 and R128 $82,000 off Wimbledon 2025;
WTA 1000 R64 $22,000 off Dubai 2025. Arithmetic in the research doc.

### The owner's condition ruling, and then his own curve

«просто на поздних играх шлема не надо накидывать лишних расходов кондиции и всё, а после шлема
заслуженный отпуск с моей точки зрения не противоречит.»

My first attempt capped the tier surcharge at five matches per run, which made the sixth and seventh
rounds cost **2** where the first five cost **8**. He rejected it – «а сейчас немного некорректно
получается» – and wrote the curve out himself, as the bounds of a match at these rungs round by round:

```
  min  5 6 7 7 7 7 7        max  7 8 9 9 9 9 9
```

That is not a cap, it is a **ramp**: read against `matchDrain`'s parts (scoreline 2–4 plus a
surcharge of 5) the surcharge reaches its full value over three matches instead of landing flat on
the first. A cliff became a plateau, and «сама идея накопленной усталости сохранится нормально».

Shipped as a THIRD run-fatigue ladder, `[-2, -1, 0]`, keyed on `drawSize > 32` rather than on the
track – the same per-family mechanism that already carries two, and the trailing zero is what makes
the plateau follow `tierMatchFatigue` instead of duplicating it.

| | title, best–worst | at draw 32 |
| --- | --- | --- |
| Slam (7 rounds) | **46–60** | 39–49 |
| WTA 1000 (6 rounds) | **39–51** | 39–49 |

Exactly what he predicted when he wrote the rows: the Slam gets dearer, the 1000 barely moves.

### Do the big events collide? No – and the floor is a caution, not a gate

His follow-up: «удостовериться, что в расписании 1000 и шлем не идут подряд никогда, иначе мы сами
противоречим.»

The twelve big weeks are `2* · 5 · 8 · 12 · 18 · 21* · 26* · 31 · 34* · 37 · 41 · 45`. **The closest
pair is three weeks apart**, so there are always at least two free weeks between them. Never
consecutive.

After the worst case a Slam can produce – a title won in seven three-set triple-tiebreak epics – she
ends the week on 40, against an entry floor of 60:

| | arithmetic | verdict |
| --- | --- | --- |
| rest plan | 40 + 2 × 10 | **60 – clears** |
| grind plan | 40 + 2 × 8 | 56 – four under |
| ordinary straight-sets title | 54 + 2 × 8 | **70 – clear either way** |

⚠ **And the 60 is a caution, not a gate.** `entryVerdict` returns `{ level: 'caution' }` below
`minConditionToEnter`; the only thing that refuses an entry is `medicalBlock`, at 15. So the calendar
**cannot** make a big event unenterable – the worst it can do is make one unwise, which is the design
(«мы ни за что не наказываем»).

What it CAN do is raise her injury risk, and `mandatoryBinds` deliberately does not ask her
condition. So a top-50 player who wins a Slam in seven epics and finds a 1000 three weeks later is
choosing between a tired entry and a penalty point. **That is the interaction worth watching – not
the calendar, which is clean.**

### ⚠ An ending that appeared, was investigated, and went away again

Worth recording because it is the shape of a false alarm. Under the INTERMEDIATE version – the deep
draws with my surcharge cap – `tests/long-career-ledgers.test.ts`' deliberately extreme career
(highest available rung every week, no rest, no vacation) ended: `injury`, week 307, age 19.

I checked before touching anything, and the A/B said the deep draws leave her **less** injured, not
more: 7 injuries and 21 weeks lost against the 32-draws' 10 and 35. Two of them simply landed four
weeks apart on a diverged RNG.

**Under the owner's curve the career survives all ten seasons again**, because the ramp makes the
opening rounds cheaper than my cap ever did. Every re-aim I had made to that test to accommodate the
ending was reverted; the file is byte-identical to its pre-wave self.

The lesson kept rather than the fix: a balance change moves a fixture career's RNG, and the first
question is always whether the population got worse or this seed did.

## 9. Two side findings from the same run, both cheap

* **Seven to ten weeks a season buy literally nothing.** Measured on all three saves: weeks where
  she won no match AND the row fell outside the eighteen anyway. Naomi w621: **7 weeks, $5,700** in
  entry fees. Naomi w674: **9 weeks, $7,900**. Olivia w413: **10 weeks, $8,800**. Nearly all are
  WTA 500s and 250s, where an opening loss pays 1 point. Both girls enter nine 500s in the window
  and bank 2 and 1 counting slots from them respectively. Whether that is the mandatory quota biting
  (it binds the top 50 – six of ten 500s) or the player choosing badly, **the game never tells him a
  500 opener is worth 1 point while the w50 title he skipped is worth 50.** That is a legibility
  problem before it is a balance one.
* **A skipped mandatory really does cost a whole slot.** Olivia carries a `mandatoryMiss` zero at
  week 395 in her counted eighteen. The rule works exactly as the owner specified it.

## 10. The «108 points» lead – CLOSED, and it was a word

He sent three screenshots with the figure circled in red: **163 points** after a WTA 1000 first-round
loss, **91** after a W35 win, **227** after a three-set Slam.

It is not a ranking figure at all. `matchReadout.ts` swaps the under-court counter from the live game
score to the match total once the match ends, and the total is **rallies played** – 163 in 1:35:12,
91 in 0:58:26, 227 in 2:12:12. The arithmetic was always right.

**What was wrong is the word.** «Points» is this game's most overloaded noun: ranking points are also
points, they are also three digits, and this very flow writes them one screen later as «+130 pts».
So a match statistic read as a payout, and a WTA 1000 opener appeared to pay 163. He filed it as an
economy bug three times before it turned out to be a label.

Now reads **«163 points played»**. Measured against a phone rather than argued about
(`tools/runoff-probe.mjs`, the round-20 rule): the widest reading the band can ever hold – a 400-point
match, well past anything best-of-three can produce – is 135px, centred, clear of a live serve-speed
reading at either end, at the app's real 323px content width AND at the 279px narrow bound the
shipped comment was originally measured at. That comment carried a stale number and now carries this
one.

⚠ And my own earlier guess was wrong: I proposed 108 = `wta500.points[3]`, a quarterfinal. It was a
rally count all along. The lead was plausible and it was not the answer.
