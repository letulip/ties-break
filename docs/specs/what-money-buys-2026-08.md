---
type: spec
status: draft
area: economy
canonical: false
last-reviewed: 2026-08-12
---

# What money buys – what gates the ladder, what a coach rung is worth, and when the budget stops deciding

**Status: MEASUREMENT. Nothing shipped.** No shipped constant is changed. §6 patches
`ECONOMY.coach.hourlyRateCents` in memory to price the owner's own two proposals, restores it in a
`finally`, and exits 1 if the restore did not take – the pattern `growth-age-curve-2026-08.md` uses.
Everything else runs against the engine exactly as it ships. `git diff` under `src/` is empty.

What this branch adds is `tools/what-money-buys.ts` and this page.

**Measured on `wave/flags-grant` head `6d790e2`.** Reproduce:

```bash
npx vite-node tools/what-money-buys.ts -- --only 0                    # arithmetic, instant
npx vite-node tools/what-money-buys.ts -- --only 1 --seeds 16         # 192 careers
npx vite-node tools/what-money-buys.ts -- --only 7 --seeds 16         # 64 careers
npx vite-node tools/what-money-buys.ts -- --only 2,3 --seeds 12       # 180 careers
npx vite-node tools/what-money-buys.ts -- --only 4 --seeds 12         # 120 careers
npx vite-node tools/what-money-buys.ts -- --only 5 --seeds 8          # 128 careers
npx vite-node tools/what-money-buys.ts -- --only 6 --save <a .tsave>  # local only
```

⚠ **The saves are personal.** Both were read locally through the engine's own import door
(`decodeExportFile`), exactly as `tools/round15-read.ts` does. Nothing is committed from either – no
fixture, no path, no career – beyond the aggregates on this page.

---

## 0. The one-page answer

| question | answer |
| --- | --- |
| **Is the ladder gated by the wallet?** | **No, and it is a zero rather than a small number.** Defusing the wallet entirely – $10,000,000 a week for twenty-four years – produces a career **byte-identical to the shipped one** in every column: same rank, same rungs, same 555 entries, same $641,760 (§3a). |
| Is money worth anything in rungs? | **$1,000 is worth 0.00 points of talent.** A lump grant of $250,000 at week 0 moves the mean rung by **0.00** and career prize by **$0** (§7d). |
| And the win → prize → more entries loop? | **It returns $0.00 per dollar. In this cell there is no loop** (§7d). |
| **Then what DOES gate it?** | **Which of the three ranking tables she spends her weeks in.** A parent who always takes the draw she can win instead of stepping up loses **377 ranking places, 4.25 rungs and $567,894 – in 16 of 16 paired careers** (§4). |
| ⚠ And she is a better player for it? | **Yes. +4.6 skill points.** She trains up and ranks down – every signal the game gives her points the wrong way (§4b). |
| Why does it cost so much? | **Junior and domestic points are currencies the professional table does not accept.** `TIERS.w15.enterPointBand` is `[120, MAX]`: 120 ITF points open the pro ladder and **there is no upper bound**, so every junior point above the 120th is worth nothing. A J300 title alone is 300 (§2a). |
| ⚠ And which ladder posts the bigger number? | **The wrong one.** A National title pays **200 points**, a W15 title pays **15**. Nothing ever closes the domestic ladder – no `maxAgeYears`, no upper band (§2a). |
| **Can the player see any of this?** | **No.** `RankHelpDialog.vue` – the game's own "how ranking works" screen – hardcodes `['domestic','itf']` and says she has **"two rankings"**. The professional table is not rendered in it at all. The fork at nineteen shows her **junior** rank. The coach is structurally unable to warn her (§5). |
| Was the setup right that Naomi is poorer? | **Both families are `working`.** The $315,000 gap is **prize money** – the scoreboard of the ladder, not the ticket onto it (§1). |
| **Does the coach ladder earn its price?** | **`budget` yes, everything above it no.** Budget saves **11-17 weeks of injury** and never lowers solvency. `middle` costs 2.5× and beats self-coaching on **no ranking axis below a wealthy background**. `high` works only for the wealthy, at **$4,124 a ranking place**. `elite` is **8.3% solvent for a WEALTHY family** (§6c-d). |
| So why pay a coach at all? | **For the physio, not the forehand** – and honestly, for the radar (permanent read error ±3.36 self-coached → ±2.16 budget → ±0.60 high → ±0.00 elite). Nothing above `budget` measurably buys performance (§6d). |
| ⚠ And at a `working` background? | **Do not pay one at all.** Self-coached: **$652,170** career prize, first W event at **16.4**. A middle coach: **$0**, first W event at **18.5**, three rungs lower. The bill takes **$239,000 off the travel budget** – the coach competes with the plane ticket, not the racket (§6a). |
| **«элитного уже точно можно себе позволить»** | **Right about today, wrong about the game.** On her save elite is 11.6% of funds and 18.6% of last year's prize – easy. Bought from fourteen it bankrupts **11 wealthy families in 12** (§8a). |
| **«может быть он должен быть ощутимо дороже»** | **A null change – do not.** ×2 and ×3 leave every outcome at 0.0% solvent and only shorten the doomed career from 30 tournaments to 9 (§8b). |
| **«между budget и middle разница небольшая»** | **Correct: +9.5% development for +71% of the bill.** But widening the price is the wrong fix – `middle ×1.4` takes that cell from **$711,330 to $0** and is invisible at wealthy. Change what the rung delivers, not what it costs (§8c). |
| **«и открываться на проф карьере уже»** | ⚠ **Take this one.** Not for affordability – gating from 18 cuts only 12% of the bill – but because the game currently sells a fourteen-year-old a purchase that ends the career eleven times in twelve, and says nothing (§8d). |
| **When does money stop being a decision? (#103)** | **Median age 19.5 – the fork.** It binds for **13.8%** of a career and is free for **86.2%**. **62 of 123 careers never had one binding week**, and 5 of 15 cells are free from week zero (§7a). |
| Is the crossover where we want it? | **No, and it is wrong in both directions at once** – it lands exactly at the fork, so act two has no budget in it at all; and it never arrives for half of all careers. Where it binds hardest (`working·high`, 78% of weeks, 12/12 bound to the end) it is not a decision either, it is a career that has ended and not been told (§7c). |
| Should we make money bind harder? | **No.** `ladder-vs-targets-2026-08.md` is already 3× over on the middle rows and a hard zero at the top; tightening money pushes the middle further out of band and **cannot touch the zero**, because a defused wallet does not move the ceiling one place (§7c). |
| What should move first? | **The two surfaces, not the numbers.** Render the professional table in the ranking tutorial, and show the professional standing at the fork (§9 items 1-2). |

---

## 1. ⚠ THE PREMISE WAS WRONG, AND CORRECTING IT IS THE FINDING

The brief set this up as a wallet question:

| | `olivia-o1p7_w361` | `naomi-3c2i_w412` |
|---|---|---|
| funds | **$323,491** | **$8,070** |
| coach | self-coached, never paid one | middle, paid |
| where she is | wta500, WTA #71 | w75, WTA #288 |

*"Naomi is 44 skill points the better player and forty times poorer… so the ladder appears to be
gated by the wallet rather than the racket."*

**Read through the engine, both families are `working`.** Same background, same parent wage, same
corridor. Neither girl was given anything.

| read from the save | olivia | naomi |
|---|---|---|
| `profile.background` | **working** | **working** |
| `profile.coachTier` | self | middle |
| career prize | **$397,670** | $75,380 |
| funds | $323,491 | $8,070 |
| condition | **100** | **54** |
| weeks lost to injury | 24 | 8 |
| total headroom | 41.0 (**p0.66**) | 75.6 (**p51.6**) |

**The $315,000 gap is prize money.** It is not an endowment that bought her the ladder; it is the
scoreboard of having been on it. So the wallet is not upstream of the climb – it is downstream of
it, and any reading that starts from "the rich girl got further" has the arrow backwards.

⚠ Two corrections to the brief's figures while the saves are open, both from the engine's own
`startingSkills`/`rollPotential` derivation (the one `potential-band-2026-08.md` §4 and
`ladder-vs-targets-2026-08.md` §5 use): headroom is **41.0 / p0.66** and **75.6 / p51.6**, not
37.5 / 71.1. The brief's numbers are measured against `withHeadStart`, which understates the true
roll by `relativeAgeHeadStart(birthMonth)` on every skill – `world.ts` flags exactly this trap.

---

## 2. WHERE THE WEEKS ACTUALLY WENT – and this is the whole page

The two saves retain a rolling ~52 weeks of results. Folded by the rung that paid them:

| rung | track | olivia, last year | naomi, last year |
|---|---|---|---|
| regional | domestic | – | **2 appearances, 96 pts** |
| national | domestic | – | **5 appearances, 555 pts** |
| w15 | wta | 2 · 16 pts | – |
| w35 | wta | 2 · 28 pts | 1 · 2 pts |
| w50 | wta | 3 · 150 pts | 6 · 81 pts |
| w75 | wta | 4 · 188 pts | 7 · 117 pts |
| w100 | wta | 1 · 25 pts | – |
| wta125 | wta | 4 · 234 pts | – |
| wta250 | wta | 8 · 255 pts | – |
| wta500 | wta | 2 · 255 pts | – |
| **totals** | | **26 of 26 professional** | **14 professional, 7 DOMESTIC** |

**A twenty-one-year-old professional spent a third of her competitive year on the domestic ladder,
and won it: 555 National Series points in twelve months, against a professional book of 200.** Every
one of those 555 points is worth exactly zero on the table that decides which tournaments she may
enter.

Olivia's twenty-six weeks are a straight walk up the W ladder – w15 → w35 → w50 → w75 → w100 →
wta125 → wta250 → wta500. Naomi's are a loop around a rung she had already outgrown.

### 2a. The three currencies, and the two that do not convert

`kidPoints(world, track)` takes a **required** track argument, and the comment on it says why:
*"There are two tables now and 'her points' is no longer a question with one answer."* There are in
fact three, and points never move between them.

| ladder | opens | **closes** | title pays | upper `enterPointBand` |
|---|---|---|---|---|
| domestic (`local` / `regional` / `national`) | week 0 | **never – no `maxAgeYears` on any of the three** | **200** (national) | **none** (`[150, MAX]`) |
| ITF junior (`j30` / `j60` / `j300`) | 13 | **18** (`maxAgeYears: 18`) | **300** (j300) | none |
| W professional (`w15` … `slam`) | 16 / 17 | never | **15** (w15) | none |

Three facts follow, and each is separately load-bearing:

1. **The professional on-ramp is a turnstile, not a scoreboard.** `TIERS.w15.enterPointBand` is
   **`[120, MAX]`**. 120 ITF junior points open the W ladder and there is **no upper bound**, so
   every junior point above the 120th is worth nothing professionally. The constant's own comment
   prices it honestly – *"a J60 title, or a J300 quarter-final, or a full book of J30 results"* –
   about one good junior season. **A single J300 title is 300 points: two and a half times the entire
   professional value of the junior game, in one week.**
2. **The number on the screen runs the wrong way.** A National title pays **200** and a W15 title
   pays **15**. The ladder she should be leaving posts a figure thirteen times larger than the one
   she should be joining. A player reading her own points total is being rewarded for staying.
3. **Nothing ever pushes her off.** `ladder-floor-2026-08.md` deliberately turned the window's lower
   bound from a refusal into a **sorting key**, on the owner's own ruling that having somewhere to
   play is the correct state of the world. That ruling is defensible and this page does not reopen
   it – but its cost had never been measured over a whole career, and §3 measures it.

⚠ **This is not a bug and no constant here is wrong.** Junior success predicting professional
success poorly is true to the sport. The question this page answers is narrower: **what does it cost,
and can the player see it coming.**

---

## 3. ⚠ WHAT GATES THE LADDER – measured, and it is none of the four things the brief proposed

16 seeds, `25k middle · self-coached`, `player` policy, 14 → 38. Every arm is the **same girl** under
one changed constraint – `openCareer`'s seed is `bench-<background>-<index>` and `startingSkills`
ignores the profile, so the pairing is exact. The two talent arms are seed-screened on the exact
population percentile, which is a different girl by construction.

| arm | solvent | rank p50 | best | top-250 | top-100 | wta250+ | mean rung | entries | prize p50 | 1st W age |
|---|---|---|---|---|---|---|---|---|---|---|
| **shipped** (up as soon as allowed) | 100.0% | **#174** | #138 | 93.8% | 0.0% | 68.8% | 5.56 | 555 | **$641,760** | 16.55 |
| W refused until 17 | 100.0% | #174 | #137 | 93.8% | 0.0% | 75.0% | 5.63 | 566 | $612,450 | 17.15 |
| W refused until 18 | 100.0% | #174 | #136 | 93.8% | 0.0% | 68.8% | 5.56 | 567 | $585,440 | 18.05 |
| W refused until 19 | 100.0% | #174 | #136 | 87.5% | 0.0% | 68.8% | 5.56 | 556 | $579,900 | 19.02 |
| **wallet defused** ($10M every week) | 100.0% | **#174** | **#138** | **93.8%** | 0.0% | **68.8%** | **5.56** | **555** | **$641,760** | **16.55** |
| health defused (see the ⚠ below) | 100.0% | #20 | #11 | 100.0% | 93.8% | 100.0% | 8.69 | 1130 | $23,108,540 | 16.19 |
| wallet + health defused | 100.0% | #20 | #11 | 100.0% | 93.8% | 100.0% | 8.69 | 1132 | $23,984,450 | 15.92 |
| talent p90+ | 100.0% | #170 | #130 | 93.8% | 0.0% | 87.5% | 5.75 | 532 | $684,380 | 16.37 |
| talent p<10 | 100.0% | #216 | #163 | 87.5% | 0.0% | 25.0% | 5.06 | 580 | $460,120 | 16.88 |

*mean rung = mean index into `[w15, w35, w50, w75, w100, wta125, wta250, wta500, wta1000, slam]` of the strongest rung ever entered.*

### 3a. ⚠ THE WALLET ARM IS BYTE-IDENTICAL TO SHIPPED

Not "close". **Identical, in every column**: same median rank, same best rank, same reach shares,
same mean rung, same 555 entries, same $641,760, same first-W age to two decimals. Handing this
family ten million dollars a week for twenty-four years changes **nothing at all**, because the
budget never once refused an entry it was otherwise allowed to make.

**So money does not gate the ladder in this cell. It is not a weak effect – it is a zero.**

### 3b. And the effect sizes, ranked

Paired against `shipped`, mean over 16 pairs. Positive rank delta is **worse**.

| constraint changed | Δ peak rank | Δ mean rung | Δ prize | pairs it made worse |
|---|---|---|---|---|
| **plays the winnable rung instead of stepping up** (§4) | **+377** | **−4.25** | **−$567,894** | **16 / 16** |
| health/availability defused | −154 | +3.13 | +$22,466,780 | 0 / 16 |
| talent p<10 → p90+ | −46 | +0.69 | +$224,260 | – (unpaired) |
| W entry delayed to 19 | 0 | 0.00 | −$61,860 | – |
| **wallet defused** | **0** | **0.00** | **$0** | **0 / 16** |

⚠ **The health arm is a BOUND, not a strategy, and it must not be quoted as one.** Pinning condition
at 100 and clearing every injury removes the load model entirely, so she enters **1,130 of 1,300
weeks** against the shipped 555 – she plays twice as much tennis as any real career can. What it
establishes is the shape of the ceiling rather than a reachable outcome: **the model's top is set by
how many weeks she can be on court**, and once that is unbounded a #174 career becomes a #20 one.
That is worth knowing and it is not a recommendation.

⚠ **And the delay arms answer their own hypothesis in the negative.** Refusing the professional
calendar until nineteen costs **nothing in rank** (#174 in all four arms; the best rank actually
improves by two places) and **$61,860 of prize, 9.6%**. So "entering the W ladder late" is not by
itself the trap – she catches up. What is fatal is the thing §4 measures, which is different.

---

## 4. THE LINGERER – it is not WHEN she steps up, it is WHETHER she ever stops going back

The delay arms above still put her on the W ladder eventually and keep her there. The save shows
something else: a twenty-one-year-old **still entering National Series**. So the arm that models her
refuses a W event whenever **any** non-W event is open the same week – a parent taking the draw his
daughter can win, every time. That is not a rule change; it is exactly what the sorting key permits.

| arm | rank p50 | best | top-250 | wta250+ | mean rung | entries | prize p50 |
|---|---|---|---|---|---|---|---|
| 25k middle, steps up as soon as allowed | **#174** | #138 | **93.8%** | **68.8%** | **5.56** | 555 | **$641,760** |
| 25k middle, **takes the winnable rung** | **#540** | #404 | **0.0%** | **0.0%** | **1.31** | 596 | **$49,620** |
| 8k working, steps up | #144 | #128 | 43.8% | 43.8% | 2.06 | 588 | $0 |
| 8k working, **lingers** | #398 | #300 | 0.0% | 0.0% | 0.31 | 608 | $0 |

### 4a. Where the weeks went

| arm | domestic | ITF junior | W professional | **% of entries that paid W points** |
|---|---|---|---|---|
| 25k, steps up | 84.4 | 37.4 | **397.3** | **76.5%** |
| 25k, lingers | **419.5** | 70.1 | 45.9 | **8.6%** |
| 8k, steps up | 360.8 | 14.5 | 185.3 | 33.0% |
| 8k, lingers | **535.9** | 16.6 | 20.8 | **3.6%** |

### 4b. Paired – the same girl, both ways

| pair | Δ 1st W age | Δ peak rank | Δ mean rung | Δ peak book | Δ prize | Δ end skills | worse in |
|---|---|---|---|---|---|---|---|
| **25k: lingers vs steps up** | +0.70y | **+377** | **−4.25** | **−368 pts** | **−$567,894** | **+4.6** | **16 / 16** |
| 8k: lingers vs steps up | +0.98y | +128 | −1.75 | −202 pts | −$347,946 | +0.1 | 7 / 16 |

**Sixteen pairs out of sixteen.** Not a tendency – every single career.

⚠ **And she is a BETTER PLAYER for it.** The lingerer finishes **4.6 skill points ahead** of herself,
because she plays more matches (596 entries against 555) and travels less. **She trains up and ranks
down.** Every signal the game gives her – more wins, more titles, more points on the domestic table,
a better forehand – points the wrong way, and the one signal that matters is on a screen she has no
reason to open.

**This is the gate. It is not the wallet, not the racket, not the coach, and not the body.**

---

## 5. ⚠ CAN THE PLAYER SEE IT COMING? – no, and the tutorial teaches the wrong model

A dominant strategy nobody can see is the real defect, whatever the balance says. Every ranking
surface, help screen, coach line, diary line, letter and tutorial was checked.

| where a player might learn it | what is actually there |
|---|---|
| **`RankHelpDialog.vue`** – the game's dedicated "How ranking points work" popover | ⚠ **Hardcodes `['domestic', 'itf']` and its lede says she has "two rankings". The professional table is not rendered at all** – the one screen built to explain the currencies teaches a two-table model when there are three |
| `StatsScreen.vue` Pro tab | The only place that pairs both facts: *"She has not played a professional event yet…"* plus *"Junior points never cross over."* But `shown` is seeded from `activeLadder`, which is `domestic`/`itf` for a junior – **the tab is never opened for her, and nothing points at it** |
| the coach | ⚠ **Structurally incapable of warning about it.** `coachLadderNote` returns null unless `hasOutgrown(event.tier)`, and `j60`/`j300` become outgrown only once `w35`/`w50` open – which needs `kidPoints(world,'wta') > 0`. **She must already have professional points before he may say she should go and get some.** A closed loop. And `COACH_HORIZON_WEEKS.self` is `-1`: a self-coached family gets none of it ever |
| the fork at nineteen | `ForkDialog.vue` prints her **junior** rank at the single most consequential click in the game. The professional zero is never shown there |
| `TierGuide.vue` | Says *"the two tables never meet"*, and its own text is stale – it describes "the first four rungs" while the guide now renders sixteen |
| diary, mail, offers, onboarding, radar notes | **Nothing.** No letter kind exists for advice; the onboarding tour has five steps and none is about ladders |
| both tables on screen at once | **Never, anywhere in the app** |

Two surfaces do fire unprompted and neither says what is at stake: Home's ladder strip shows a locked
`w15` chip (*"opens at age 16 and 120 international pts"*), and the Season header prints *"Pro entries
this season: 0 of 8"* from age 14. Both are gates. Neither says the junior points stop counting.

> ⚠ **THE CHIP NO LONGER SAYS THAT, AND THE FINDING SURVIVES THE CHANGE.** W15 opens at **14** since
> 16.08, so the chip's age clause is gone and the lock it still shows is the acceptance list's. The
> quotation is kept as the 12.08 screen. What is unchanged is the point of the paragraph: both
> surfaces state a gate and neither states that the junior points stop counting. Grid, stated once:
> [`college-is-its-own-branch-2026-08.md` §0a](college-is-its-own-branch-2026-08.md).

**So the honest answer is no.** The information exists in the engine, is correct, and is
unreachable in practice.

---

## 6. DOES THE COACH LADDER EARN ITS PRICE? – self-coaching is the control

12 seeds × 5 rungs × 3 backgrounds = 180 full careers. **Within a background the seeds are identical
across rungs**, so a row is the same girl with a different coach. Across backgrounds they are not –
read down a block, never across.

⚠ The bench accepts no offers and books nothing: no kit deal, no academy place, no sponsorship, no
practice week, no vacation. Every row is a **floor** for a played career.

### 6a. `working` – the background BOTH of the owner's careers actually have

| rung | solvent | rank p50 | top-250 | wta250+ | mean rung | **prize p50** | **1st W age** |
|---|---|---|---|---|---|---|---|
| **self** | 100.0% | #176 | **83.3%** | **50.0%** | **4.25** | **$652,170** | **16.44** |
| budget | 100.0% | #162 | 41.7% | 41.7% | 1.92 | **$0** | 18.00 |
| middle | 100.0% | #144 | 33.3% | 33.3% | 1.33 | **$0** | 18.46 |
| high | **0.0%** | – | 0.0% | 0.0% | −1.00 | $0 | never |
| elite | **0.0%** | – | 0.0% | 0.0% | −1.00 | $0 | never |

**This is Olivia and Naomi, reproduced.** A working family that self-coaches reaches the professional
ladder at **16.4** and earns **$652,170**. The same family that hires a *middle* coach reaches it at
**18.5**, tops out **three rungs lower**, and its median career prize is **zero**. High and elite end
the career outright – 0 of 12 survive, at either rung.

⚠ **And the mechanism is legible in one column.** Entry-and-travel spend over the career:

| rung | coach + court bill | **entry + travel** | skills @18 | weeks lost to injury |
|---|---|---|---|---|
| self | $107,600 | **$524,152** | 290.7 | 83.8 |
| budget | $171,716 | $312,799 | 297.0 | 67.5 |
| middle | $269,652 | **$285,223** | 299.1 | 62.3 |
| high | $23,708 | $953 | – (dead before 18) | 0.2 |
| elite | $17,523 | $520 | – (dead before 18) | 0.1 |

**The coach's bill does not compete with the racket – it competes with the plane ticket.** A middle
coach costs a working family $162,000 more than self-coaching and takes $239,000 *off* the travel
budget. She trains better (skills at 18: 299.1 against 290.7) and she cannot get to the tournaments,
so she plays the cheap events near home – and §4 is what happens next.

### 6b. `middle` and `wealthy`

| rung | solvent | rank p50 | top-250 | mean rung | prize p50 | 1st W age |
|---|---|---|---|---|---|---|
| **middle bg** · self | 100.0% | #174 | 91.7% | **5.50** | $641,760 | 16.61 |
| middle bg · **budget** | 100.0% | **#154** | 83.3% | 4.67 | **$765,480** | 16.38 |
| middle bg · middle | 100.0% | #155 | 66.7% | 3.50 | $711,330 | 17.14 |
| middle bg · high | **16.7%** | #152 | 8.3% | −0.42 | $0 | 20.58 |
| middle bg · elite | **0.0%** | – | 0.0% | −1.00 | $0 | never |
| **wealthy bg** · self | 100.0% | #180 | 83.3% | 4.75 | $624,140 | 16.39 |
| wealthy bg · **budget** | 100.0% | #167 | **91.7%** | **5.42** | $726,210 | 16.25 |
| wealthy bg · middle | 100.0% | #164 | 91.7% | 5.33 | $692,000 | 16.30 |
| wealthy bg · **high** | 100.0% | **#156** | 91.7% | 5.25 | **$755,760** | 16.27 |
| wealthy bg · elite | **8.3%** | #660 | 16.7% | 0.92 | $6,590 | 16.08 |

### 6c. THE PRICE PER UNIT OF OUTCOME, against self-coaching

Mean over the 12 paired careers. "BUYS NOTHING" means the rung did not beat self-coaching on that
axis at all, at any price.

| background | rung | extra coach+court spend | **$ per skill point** | **$ per ranking place** | weeks lost saved |
|---|---|---|---|---|---|
| working | budget | +$64,116 | $6,837 | **BUYS NOTHING** | 16.3 |
| working | middle | +$162,052 | $14,556 | **BUYS NOTHING** | 21.5 |
| middle | budget | +$95,618 | $30,033 | **BUYS NOTHING** | 11.1 |
| middle | middle | +$245,009 | $20,963 | **BUYS NOTHING** | 18.3 |
| wealthy | budget | +$94,253 | $9,746 | **$652** | 17.1 |
| wealthy | middle | +$228,351 | $18,708 | **$1,579** | 17.4 |
| wealthy | high | +$592,107 | **BUYS NOTHING** | **$4,124** | 14.1 |

⚠ **The `high` and `elite` rows for working and middle are omitted from this table on purpose.**
Those careers die before eighteen, so their "skills at end" is a peak rather than a post-decline
figure and the per-unit arithmetic inverts into meaningless negatives. The honest reading of those
cells is the solvency column: **0.0%, 0.0%, 16.7%, 0.0%**.

### 6d. THE VERDICT, rung by rung

| rung | does it beat self-coaching? |
|---|---|
| **budget** | **Yes, and it is the only unambiguous buy in the game.** It saves **11-17 weeks of injury** for $64k-96k, it is the one rung that never lowers solvency, and at `middle` and `wealthy` backgrounds it posts the **best career prize of any rung** ($765,480 / $726,210). ⚠ Except at `working`, where it takes prize from $652,170 to **$0** |
| **middle** | **No.** Costs 2.5× budget, buys ~2 more skill points and 4-6 more injury weeks saved, and beats self-coaching on **no** ranking axis at any background below wealthy. At `working` it is actively career-ending in the §4 sense |
| **high** | **Only a wealthy family, and only just.** The single best prize in the whole sweep ($755,760) and the best rank (#156) – at **$4,124 a ranking place**. At `middle` it leaves **16.7%** of careers solvent; at `working`, **0.0%** |
| **elite** | **No, at any background.** ⚠ **8.3% solvent even for the WEALTHY family** – 11 of 12 careers bankrupt. It is not a luxury, it is a career-ending purchase |
| **self** | **The control wins more often than it loses.** It is the only rung a working family can afford and still travel on, and its ceiling is not visibly lower than any paid rung's below wealthy |

**So the plain answer to «зачем и почему я должен их выбирать и оплачивать»: for one reason, and it
is the physio, not the forehand.** The measured ladder is 11-17 fewer weeks in a cast, bought at the
first rung and barely improved after it. `COACH_ACCURACY` is the other honest purchase and it is a
readability feature rather than a performance one – the radar's permanent read error goes ±3.36
points self-coached to ±2.16 at budget, ±1.32 at middle, ±0.60 at high and ±0.00 at elite.

**Everything above `budget` is priced as a performance upgrade and does not measurably deliver one.**

---

## 7. WHEN DOES MONEY STOP BEING A DECISION? (task #103)

Per week, at the exact state the entry policy is about to read: **is the most expensive trip her
ranking already opens refused by the reserve?** If yes, the wallet is choosing her tournament. Weeks
with no rung open at all are excluded rather than counted as free.

| cell | share of open weeks the budget bound | LAST binding week | = age | never bound | bound to the end |
|---|---|---|---|---|---|
| working · self | 2.9% | w149 | 16.9 | 3/12 | 0/12 |
| working · budget | 15.7% | w287 | 19.5 | 0/12 | 0/12 |
| working · middle | 22.6% | w378 | 21.3 | 0/12 | 0/12 |
| working · high | **78.0%** | w71 | 15.4 | 0/12 | **12/12** |
| working · elite | **75.1%** | w36 | 14.7 | 0/12 | **12/12** |
| **middle · self** | **0.0%** | – | – | **12/12** | 0/12 |
| middle · budget | 5.3% | w280 | 19.4 | 3/12 | 0/12 |
| middle · middle | 13.7% | w286 | 19.5 | 1/12 | 0/12 |
| middle · high | 42.1% | w166 | 17.2 | 0/12 | 10/12 |
| middle · elite | 37.2% | w80 | 15.5 | 0/12 | 12/12 |
| **wealthy · self / budget / middle** | **0.0%** | – | – | **12/12 each** | 0/12 |
| wealthy · high | 4.7% | w365 | 21.0 | 7/12 | 0/12 |
| wealthy · elite | 16.4% | w185 | 17.6 | 0/12 | 11/12 |

### 7a. The two phases

Pooled over 123 careers that reached eighteen without folding:

| phase | median weeks | median years | **share of career** |
|---|---|---|---|
| **MONEY DECIDES** – up to the last binding week | 0 | 0.0 | **13.8%** |
| **MONEY IS FREE** – after it | 1,048 | 20.2 | **86.2%** |

**The crossover age: p10 17.0 · p25 18.7 · MEDIAN 19.5 · p75 21.0 · p90 22.7 – and 62 of 123 careers
never had a binding week at all.**

So the answer to task #103 is: **the budget stops constraining any choice at about nineteen and a
half, it never constrains half of all careers for one week, and it constrains none of them for more
than about a seventh of the game.** Five of the fifteen cells measured are free from week zero.

### 7b. And afterwards the family is rich, in every cell that survives

Median funds at each season boundary:

| cell | age 14 | age 18 | age 22 | age 26 | age 30 | **age 38** |
|---|---|---|---|---|---|---|
| working · self | $8,000 | $16,428 | $88,555 | $178,558 | $269,172 | **$646,922** |
| working · middle | $8,000 | $5,638 | $8,357 | $28,721 | $103,713 | **$416,995** |
| middle · self | $25,000 | $38,184 | $90,438 | $212,175 | $402,557 | **$977,048** |
| wealthy · self | $120,000 | $151,761 | $258,874 | $510,550 | $890,996 | **$2,157,176** |

**A working family that self-coaches ends the career with $646,922 – eighty times what it started
with.** `incomeGrowthBand` is `[0.05, 0.10]` compounding, so the parents' wage alone is **×5.7** over
a 14 → 38 career while every cost constant in `ECONOMY` is the number it was at fourteen. The
cheapening is by construction, and the prize money on top of it is what turns "cheaper" into
"irrelevant".

### 7c. Is the crossover where we want it?

**No, and it is in the wrong place in both directions at once.**

- It arrives **at the fork**. Age 19.5 is `ENDINGS.forkAgeYears` almost exactly. Every money decision
  the game contains is taken in act one, and act two – twenty years of it, 86% of the career – has no
  budget in it at all.
- It **never arrives** for half of all careers. A `middle`-background family that self-coaches, and a
  `wealthy` family at three of five rungs, plays the entire game with the wallet outside the decision.
- And where money *does* bind hardest it is not a decision either: `working · high` binds **78.0% of
  weeks and bound to the end in 12 of 12**. That is not a constraint the player trades against, it is
  a career that has already ended and has not been told.

⚠ Against `ladder-vs-targets-2026-08.md`, which is the page any change here has to be priced against:
the middle rows are already **3× over** (lives-from-tennis 66.3% against a 15-25% target) and the top
is a **hard zero** (0.0% against 3-6%). **Making money bind harder or longer would push the middle
rows DOWN toward their target and the top row nowhere** – it cannot fix the zero, because §3 shows a
defused wallet does not move the ceiling by one place. So a money tightening is at best half a fix
and at worst a way of missing both rows.

### 7d. ⚠ THE EXCHANGE RATE IS ZERO, and the feedback loop the brief warned about does not exist

A lump grant at week 0, six levels, exactly paired, `25k middle · self-coached`:

| grant at week 0 | Δ mean rung | Δ entries | Δ best rank | Δ career prize | **prize returned per $1 granted** |
|---|---|---|---|---|---|
| +$10,000 | 0.00 | 0.0 | 0 | $0 | **$0.00** |
| +$25,000 | 0.00 | 0.0 | 0 | $0 | **$0.00** |
| +$50,000 | 0.00 | 0.0 | 0 | $0 | **$0.00** |
| +$100,000 | 0.00 | 0.0 | 0 | $0 | **$0.00** |
| +$250,000 | 0.00 | 0.0 | 0 | $0 | **$0.00** |

Every column of every arm is byte-identical to the control. Against talent measured in the same
currency, on this sweep's own four-band talent arms (12 seeds a band, so the figures differ slightly
from §3's two-decile 16-seed arms and both are reported rather than reconciled) – 49.6 points of
headroom from p<10 to p90+ moves the mean rung by **0.42** and the median rank by **41 places**:

> **$250,000 is worth 0.0 points of talent. $1,000 is worth 0.00 points of talent.**

**And the "win → prize → afford more entries → win more" loop returns $0.00 on the dollar.** It is not
a steep loop, it is not a shallow loop – in this cell it is not a loop. The early game is not the
whole game, because the early game's currency does not buy anything.

⚠ **Money DOES bind in five of the fifteen cells, and every one of them has a coach in it.**
`working · high` binds 78.0% of weeks; `working · elite` 75.1%; `middle · high` 42.1%; `middle ·
elite` 37.2%; `wealthy · elite` 16.4%. The three cells with no coach bill never bind at all. **The
coach ladder is the only thing in this economy that manufactures a money constraint** – and §6a shows
what it spends the money on, which is the plane ticket.

---

## 8. THE OWNER'S TWO PROPOSALS, PRICED – and only one of them survives

8 seeds a cell, `ECONOMY.coach.hourlyRateCents` patched in memory and **restored byte-identical**
(asserted; the tool exits 1 otherwise).

### 8a. «элитного уже точно можно себе позволить… 30к в год на фоне 300к+» – he is right about TODAY and wrong about the game

On her own save, at 20.8, an elite coach is **$720/wk = $37,440/yr = 11.6% of her funds**, and
**18.6% of the $201,400 of prize she earned last year**. He is correct: she can afford it easily.

But that is a fact about a career that has already succeeded. Bought from fourteen, the same rung:

| background | elite, solvent at the end of a full career |
|---|---|
| working | **0.0%** (0 of 12) |
| middle | **0.0%** (0 of 12) |
| **wealthy** | **8.3%** (1 of 12) |

**A wealthy family buying the elite rung at fourteen goes bankrupt eleven times in twelve.**

### 8b. «может быть он должен быть ощутимо дороже» – measured, and it is a null change

| variant | middle bg: elite solvent | wealthy bg: elite solvent | weeks she gets before it ends |
|---|---|---|---|
| shipped | 0.0% | 0.0% (8 seeds) | 30 / 80 entries |
| **elite ×2** | 0.0% | 0.0% | 13 / 45 entries |
| **elite ×3** | 0.0% | 0.0% | 9 / 31 entries |

**Making elite dearer changes no outcome, because it is already past the point where price matters.**
The only thing it moves is how many tournaments she gets to play before the career ends – 30 down to
9. That is not a balance change, it is a shorter walk to the same wall. **Recommendation: do not.**

### 8c. «между budget и middle разница как будто небольшая» – he is right about the STEP and wrong about the FIX

He is right that the step is small. On the shipped constants:

| step | development | radar accuracy | physio quality | season bill, middle bg | **$ per +1% of development** |
|---|---|---|---|---|---|
| self → **budget** | **+15.9%** | +10pp | **+1.00** | $5,720 → $9,100 | **$213** |
| budget → middle | +9.5% | +7pp | +0.15 | $9,100 → $15,600 (**+71%**) | $686 |
| middle → high | +6.7% | +6pp | +0.20 | $15,600 → $26,000 | $1,545 |
| high → elite | +3.6% | +5pp | +0.25 | $26,000 → $41,600 | **$4,329** |

**The ladder's steps shrink while its price doubles – so the first rung is twenty times better value
than the last, and the owner's instinct that budget→middle is a poor trade is correct: +9.5% of
development for +71% of the bill.**

But widening the gap is the wrong repair. Measured (`middle` rate ×1.4):

| cell | top-250 | mean rung | prize p50 |
|---|---|---|---|
| middle bg · middle, **shipped** | 62.5% | 3.38 | **$711,330** |
| middle bg · middle, **×1.4** | **25.0%** | **0.75** | **$0** |
| wealthy bg · middle, shipped | 87.5% | 5.00 | $692,000 |
| wealthy bg · middle, ×1.4 | 87.5% | 5.00 | $708,930 |

**Widening the gap does not make the rungs feel different – it deletes the middle rung for everyone
who is not wealthy.** A 40% rise takes a viable career to a $0 one at the `middle` background and is
invisible at `wealthy`. **Recommendation: do not widen the price. If the step must feel bigger, the
honest lever is what the rung DELIVERS** – `coach-as-load-manager.md` §6 already says so, and §6c
here says the same thing from the other end: above `budget` the ladder buys almost nothing measurable.

### 8d. «и открываться на проф карьере уже» – ⚠ THIS ONE IS RIGHT, for a reason he did not give

| gate | weeks of a 14 → 38 career it shuts out | career elite bill, middle bg |
|---|---|---|
| none (shipped) | 0 of 1,300 (0%) | $1,195,600 |
| from 16 | 104 of 1,300 (8%) | $1,133,200 |
| **from 18 (the pro career)** | **208 of 1,300 (16%)** | **$1,050,200** |
| from 18 and ×2 dearer | 208 of 1,300 (16%) | $2,100,400 |

⚠ **Note the bill barely moves** – gating from 18 removes 16% of the weeks and only **12%** of the
cost, because `hourlyRateCents` rises with her age band. So the gate is not an affordability fix.

**It is a legibility fix, and that is the case for it.** §8a is the whole argument: the elite rung is
comfortably affordable exactly when the professional career is paying, and ruinous for 11 families in
12 before it. **The game currently offers, to a fourteen-year-old, a purchase that ends the career
eleven times in twelve, and says nothing.** A gate that opens it when it becomes survivable is the
game refusing to sell something it knows does not work – which is the same argument
`coach-tiers.md` already left a hook for (*"Leave the hook in the model; the owner decides whether it
is on"*).

**Recommendation: this is the one to take**, and its justification is protecting the player from an
unsurvivable purchase rather than balancing a rung.

---

## 9. WHAT FOLLOWS – in the order the decisions have to be taken

Nothing here is a proposal to ship. Smallest first.

| # | action | why | cost |
|---|---|---|---|
| 1 | **`RankHelpDialog.vue` renders the professional table.** It hardcodes `['domestic','itf']` and tells the player she has "two rankings" | the game's own tutorial teaches a two-currency model when there are three – this is a plain defect, not a balance question (§5) | one array, one sentence |
| 2 | **Show the professional standing at the fork at nineteen.** `ForkDialog.vue` prints her junior rank at the most consequential click in the game | the fork is the last moment the information could change a decision (§5) | one field |
| 3 | **Decide whether the domestic ladder should ever close.** No domestic rung has a `maxAgeYears` and none has an upper `enterPointBand`, so a twenty-one-year-old professional can win National Series forever, and one did (§2, §4) | ⚠ this reverses nothing by itself – `ladder-floor-2026-08.md`'s ruling that she must always have somewhere to play is not in question. What is in question is whether that somewhere should still be paying 200-point titles at twenty-two | the owner's call |
| 4 | **Give the coach one sentence about the step-up.** `coachLadderNote` cannot warn about `j60`/`j300` because they only become "outgrown" once she already holds professional points – a closed loop (§5) | it is the pillar `what-a-coach-is-for.md` calls scheduling, and it is the one thing a coach could say that would be worth $64,000 | a wave |
| 5 | **Gate `elite` to the professional career** (§8d) | the game sells a fourteen-year-old a purchase that ends 11 careers in 12 | the hook already exists in `coach-tiers.md` |
| 6 | **Do NOT make elite dearer** (§8b, a null change) and **do NOT widen budget→middle** (§8c, it deletes the rung below wealthy) | both measured | – |
| 7 | **Leave the money constants alone.** `incomeGrowthBand`, the grant sweep and the defused wallet all say the same thing: money is not a gate (§3a, §7d) | ⚠ and tightening it would push `ladder-vs-targets`'s already-3×-over middle rows further out of band while doing nothing for its hard zero at the top | – |

## 10. What this branch did NOT do

- did not move a single shipped constant. `ECONOMY.coach.hourlyRateCents` is patched in memory by §8
  only, restored in a `finally`, and the restore is asserted – `git diff` under `src/` is empty;
- did not commit, derive a fixture from, or quote anything from a personal save beyond the aggregates
  in §1, §2 and §8a;
- **did not measure the `grinder` policy or any arm that answers the fork `stop`** – every figure is
  the `player` arm, comparable with `ladder-vs-targets-2026-08.md` §2 and `potential-band-2026-08.md`
  §3;
- ⚠ **did not establish that the health arm is reachable.** Pinning condition at 100 doubles her
  playing weeks; it bounds the model and is not a strategy (§3b);
- did not re-measure the top of the ladder. Every arm here reports **0.0% top-100**, which is
  `ladder-vs-targets-2026-08.md` §2d's hard zero arriving again from a different direction, and this
  page changes nothing about it.

