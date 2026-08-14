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

I reported the nine-entry WTA 500 season as **Naomi's**. It is **Olivia's**. Round-18's ledger §7
frames it as «his Naomi's brutal season» and that is wrong too. The 23.1% first-round rate quoted
beside it is Olivia's own, so the arithmetic held; only the name did not.

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

## 4. What is actually on the table for the owner

Three options, and the choice is his:

* **Leave it.** Real tennis does reward access, our 32-draw genuinely is "the last 32 of a major",
  and a girl who gets in has cleared the hardest acceptance list in the sport. The cost is that the
  ranking stops being about winning at exactly the point the player starts caring most, and that a
  two-place difference at #104 decides a career.
* **Pay the real opener.** Slam 10, WTA 1000 10, with the rest of each column unchanged. This is the
  rulebook's own number and needs no new rule. It removes 975 free points and makes the cut a door
  rather than a dividend. It will move every professional in the field, so it needs a re-measure of
  the acceptance cuts, not just a constant change.
* **Restore the missing rounds.** Draw 128/96 at those two rungs so the 130 is earned the way it is
  earned. The `drawSize` note already says why this is not free: the field is not deep enough
  (a 128 wants `FIELD.size` near 520) and the research does not print R64/R128 values.

**Recommended: the second, measured before shipped.** It is the smallest change that removes the
free points, and it is the only one of the three that the rulebook already answers.

## 5. Two side findings from the same run, both cheap

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

## 6. The «108 points» lead, still open

He asked what "108 points" meant after a win in a Round of 16. **108 is a real number in this game:
`wta500.points[3]`, what a quarterfinal pays** – and his fresh Naomi save carries that exact row
(week 657, wta500, 108, Quarterfinalist). Winning a Round-of-16 match makes her a quarterfinalist,
so the figure would be correct. He remembers it as a WTA 1000, where a quarterfinal pays 215. Needs
a screenshot to close: either he mis-read the tier, or a surface is labelling one.
