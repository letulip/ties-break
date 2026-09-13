---
type: spec
status: current
# ⚠ `economy/brand` AND NOT `simulation-and-balance`, which round 41 P1's one-market spec already
# holds as the canonical document of (`scripts/context-audit.mjs` allows exactly one per area). This
# is the narrower subject anyway – what fame is made of and what a brand is worth – so the area is
# the honest one rather than a slot found for it.
area: economy/brand
canonical: true
last-reviewed: 2026-09-12
---

# The fame and the brand — the whole mathematics, round 41 #18 part two (12.09.2026)

**The ruling this exists to satisfy, verbatim:**

> «да, делаем fame за основу Шлема, надо полностью с математикой бренда разобраться, чтобы этот
> вопрос уже не поднимался, а механизм слаженно, гладко и четко работал. У тебя вся история
> супер-звезды есть, более крутой карьеры мне пока не выпадало. Она разве что только в топ-1 не
> попадала, но на топ-2 была. Это точно эталонный рецепт знаменитости. Федерер выиграл Шлем в 19,
> она тоже.»

So this document has two jobs and they are not the same job. The first is the BUILD: a Slam main
draw now buys fame, once, dated. The second is the AUDIT — every source of fame and every link of
the brand chain written down in one place with its constant, its clock and one sentence of why, so
the question does not have to be asked a fourth time.

The reference career throughout is the owner's own save (`prologue-pmb8nzwh`, week 405, Alice at
21.0, wealthy). It is PERSONAL and is never committed; only the aggregates below leave it
(`tools/plateau-probe.ts`'s standing rule). Her shelf: Slam title w314, Slam lost final w234,
eleven World Tour 500 titles from w166, seven World Tour 1000 titles from w220, the brand bought
w138 for $250,000 at fame 9.8.

## Current truth

* **Fame is an accounted stock, never a roll.** It is a pure fold over dated records the save
  already keeps and never prunes, re-derived on every read. There is no `Rng` on any path, no
  persisted fame field, and therefore no way for a player's choice to move the world's dice
  (`world/fame.ts`; proved on a ticked world by `tests/round29p5-business.test.ts`).
* **`fame = min(100, floor × shootMultiplier)`.** The floor is earned on court; the photographs
  multiply it. Zero floor times anything is zero.
* **Since 12.09 the floor has a sixth source: HER FIRST GRAND SLAM MAIN DRAW**, worth
  `ECONOMY.fame.slamDebutFloor` = **4**, dated at the week she played it, decaying on the title
  clock, **once per career**. Before it, a Slam main draw was worth exactly zero fame unless she
  reached the final.
* **The date comes from a `keep: true` milestone row**, `SLAM_DEBUT_KEY`, fired in
  `finalizeTournament`. **`SAVE_SCHEMA_VERSION` stays 74**; no migration, no fixture, zero RNG.
* **No retroactivity.** A career that reached a Slam before this shipped carries no row and earns
  nothing back. §6 states what that costs and on whom.
* **The brand chain is one mechanism, not two dials**: fame → reach → income → multiple → worth,
  and `worth / a year of income` is the multiple again to the cent.

## 1. Every source of fame, in one table

All constants live in `ECONOMY.fame` unless named otherwise. Three clocks, and they are three facts
about how long the world remembers three different kinds of thing — a title, a campaign, a career.

| source | where it is read from | constant | value | clock | why |
| --- | --- | --- | --- | --- | --- |
| **Title, per tier** | `trophiesByTier[tier].titles` (dated, append-only, v31) | `titleFloor` | w15 0.25 · w35 0.5 · w50 0.75 · w75 1 · w100 1.5 · wta125 2 · wta250 4 · wta500 8 · wta1000 14 · **slam 25** | title, 104 w | winning is what the world reads. Junior and domestic rungs are absent by name: the world does not read junior draws. |
| **Lost final, every tier but Slam** | the same ledger's `finals` | `finalFloorShare` × that tier's own title step | 0.4 | title, 104 w | a runner-up plate is a dated professional result. A share, not a ladder, so it cannot drift from `titleFloor`. |
| **Lost Slam final** | `trophiesByTier.slam.finals` | `slamFinalFloor` | 12 | title, 104 w | its own number (48% of the title, not 40%) — a Slam final is a global broadcast in its own right. `'slam'` is excluded from the row above **by name**, which is the one place this rule could double-count. |
| **⭐ First Slam main draw** | the `SLAM_DEBUT_KEY` milestone row's week | `slamDebutFloor` | **4** | title, 104 w | §2. The week the world learns the name. One step for the career, not one per appearance. |
| **Season ended in band** | `seasonHistory[].byTrack.wta.endRank`, dated at its own wrap | `seasonEndBands` | ≤10 → 10 · ≤20 → 4 · ≤50 → 1.5 · ≤100 → 0.6 | **career, 312 w** | «не могу забыть за год» — a decade of being a professional the world can name must not fade like an afternoon. Best matching band only, once per season. |
| **Delivered shoot (the ADD)** | signed `AdOfferTerms.shootWeeks` already lived | `shootFloorByBand` | [0.03, 0.04, 0.06, 0.08, 0.11] | **campaign**, `shootFloorHalfLifeByBand` [13, 26, 39, 52, 78] w | a collaboration is a public event in its own right; it is added, not multiplied, because a multiplier cannot lift a career with nothing to multiply. The band reaches both the size and the clock. |
| **Delivered shoot (the MULTIPLIER)** | the same weeks | `shootStep`, `shootMultCap` | 0.05 per shoot, capped ×2 | title, 104 w | the player's lever. The photographs can at most double what the court earned. |
| **The cap** | — | `cap` | 100 | — | §5(b) — the measured question, marked HIS. |

⚠ **`contractFame` is on this list in the brief and is NOT in this table, deliberately.** It is
`ECONOMY.business.merch.contracts` — +1 per **$50,000** of LIVE annual contract value
(`famePerCents` = 50 000 00 ¢), capped at **+30** (`fameCap`) — and it enters the chain **one link
later, at the REACH**, never at fame. `fameAt()` on a career with a $1M shelf and no results is
still zero. The distinction is load-bearing: the sponsor money already arrives through the deals, so
a second line inside fame would pay one contract twice, and a contract is current form with no
business raising a career's high-water mark.

### The one property that makes the table a table

Every term is `step × (a strictly decreasing function of the gap)`, so **between two dated events
fame can only fall**, and a maximum of fame over any span is attained ON one of those dates.
`fameEventWeeks()` lists them and `brandStrengthAt` walks that list instead of every week — exactly,
not on a grid. ⚠ **This is the coupling: a source added to `fameFloorOf` must be added to
`fameEventWeeks` or the peak is under-read.** The debut week was added to both in the same commit.

## 2. The build — the Slam debut floor

### 2.1 What it ends

The owner's item 18, second visit: «в моем представлении она уже должна была быть знаменита. У нее
был вайлдкард на Шлем, когда она была #155». He is describing a real hole. Of the 128 women in a
Slam main draw, the fame model could see **two**: the champion and the runner-up. A #155 wildcard
playing the biggest tournament of her life in front of the largest audience in the sport banked
nothing at all, and nothing else in the save remembered the week either — `world.results` prunes at
52 weeks, the feed's tournament row is an ordinary row the 400-cap eats, and `seasonEntries` is
current-season. Her brand therefore sat at what it cost until a World Tour 500 title woke it 36
weeks later. That plateau IS the item.

### 2.2 The mechanism

**The row.** `finalizeTournament` fires `fireMilestone(world, SLAM_DEBUT_KEY, …)` when
`event.tier === 'slam'`, beside `first-title` and `first-national`.

* **Main draw only, and it is a property of the game rather than an assumption.** Qualifying is not
  modelled at any rung — «a qualifier earns her place in a draw we do not run»
  (`season/tournament.ts`) — so the eight reserved wildcard chairs (`WILD_CARD`) and the direct
  acceptances are the only two ways in. Every Slam run that reaches `finalizeTournament` is a main
  draw. His case was the wildcard.
* **She must have PLAYED it.** `finalizeTournament` is not reached by a skipped event, by the
  walkover branch or by a medical withdrawal. A retirement mid-match does reach it and does count —
  she took the court, which is the rulebooks' own distinguishing question.
* **Idempotent by the row's own existence.** `fireMilestone` returns at its first line when the feed
  already carries the key. The second Slam and the two-hundredth write nothing, and the date stays
  the first one.
* **The row survives pruning, by law and not by luck.** `pruneEvents` (`world/bookkeeping.ts`)
  splits the feed into `kept` / her competitive matches / everything else, trims only the last two,
  and splices `kept` back **whole** — at any career length, including the pathological one its own
  header describes (382 match rows filling the cap). A career loses its debut row only by losing the
  save.

**The read.** `slamDebutWeekOf(world)` finds the row and returns its week; `fameFloorOf` adds
`slamDebutFloor × decayAt(week − debut)`. A debut in the future contributes nothing by `decayAt`'s
own rule; a debut she has not had contributes nothing because there is no row.

### 2.3 The road not taken — `mainDraws?: number[]` on `trophiesByTier.slam`

The alternative was an optional array on the Slam shelf, under the `entryRef` widening precedent
(`shared/protocol/events.ts:210-212`: five optional persisted fields already on that interface, and
commit `2763caa` adding the whole `entry` offer family at a standing schema version). It was
**refused**, for a reason that is about the ledger's contract rather than about the schema:

`TierTrophies` is the **silverware cabinet**. Its contract is «titles and finals, disjoint — one
week produces exactly one piece», and every reader in the game folds over exactly those two arrays:
the fame floor twice, `brandSignalsOf`'s `finalsLost` and `roomSize` terms, `fameEventWeeks`, the
Trophies screen. A third array holding a different KIND of fact — an appearance, not a piece of
silverware — would have to be excluded **by name** in six places, which is precisely the shape
`slamFinalFloor`'s own «excluded by name rather than by arithmetic» note exists to warn about, and
one of those six would eventually be missed. A milestone is already the game's «this happened once
and the ledger keeps it» channel: already dated, already idempotent by key, already unprunable, and
already carried by every save since v1. The only thing the array bought was a cheaper lookup, and
the feed is capped at 400 rows.

### 2.4 The debut and not the appearance

Per-appearance was written up as the alternative and rejected on **double-counting**: a regular's
Slam weeks are already paid for — she wins rounds, reaches finals, ends seasons inside a band, and
every one of those is a term in §1's table. A per-appearance step would price the same career twice
and would grow without bound for a top-20 player who plays four a year for a decade (40 appearances
× any step is a second fame model). What NOTHING in §1 can see is the FIRST one. That is a singular
event, so it is a singular step. The Cinderella story is the debut; the regular's is already told.

### 2.5 The size — predicted before it was measured

**+4**, i.e. one World Tour 250 title, and ~16% of the Slam title's own 25 — which keeps «выиграть
Шлем» an order of magnitude above «сыграть Шлем». She has won nothing; the claim is only that the
world has now seen her.

**PREDICTED, written into `tools/r41-brand-history.ts`'s header and this section before the first
run** — at the purchase week w138, debut reconstructed at w130:

| | before | predicted |
| --- | ---: | ---: |
| fame at w138 | 9.8 | **≈ 14** |
| brand income at w138 | $291 / wk | **≈ $570 / wk** |
| derived worth at w138 | $118,874 | **≈ $230,000** (≈ the $250,000 paid) |
| the wake | w166, the first W500 title | **the debut itself** |

**MEASURED** (`tools/r41-brand-history.ts`, the reference save, debut reconstructed at w130 —
commit `5c55e3fe` put the predictions above on the record before the tool had run once):

| | predicted | measured | verdict |
| --- | ---: | ---: | --- |
| fame at w138 | ≈ 14 | **13.63** (from 9.84) | **hit**, −2.6% |
| brand income at w138 | ≈ $570 / wk | **$559 / wk** (from $291) | **hit**, −1.9% |
| derived worth at w138 | ≈ $230,000 | **$240,830** (from $118,874) | **hit**, +4.7%; 96.3% of the $250,000 paid |
| the wake | moves to the debut | **w166 on BOTH arms — MISSED** | §3.2 |

The three quantitative predictions land inside 5%. **The fourth was a shape claim and it was
wrong**, which is recorded rather than tuned away: see §3.2 for why the wake could not have moved
and what the debut moves instead.

## 3. The reference career, annotated — OLD / FIXED / FIXED+DEBUT

`OLD` is the pre-round-41 closed form whose half-life was re-read from today's fame across the whole
holding period (the retro defect, fixed in part one). `FIXED` is the shipped incremental walk.
`FIXED+DEBUT` is the same walk on a world carrying exactly the milestone row `finalizeTournament`
would have written at w130 — the shipped engine functions read off an injected row, not a
re-implementation of the floor.

### 3.1 The story weeks

| week | what happened | fame | income / wk | derived worth | the walked row |
| --- | --- | ---: | ---: | ---: | ---: |
| **w138** | the brand is bought, $250,000 | 9.8 → **13.6** | $291 → **$559** | $118,874 → **$240,830** | $249,330 → $249,935 |
| **w166** | her first World Tour 500 title | 16.8 → **19.9** | $894 → **$1,261** | $401,553 → **$590,305** | $233,193 → **$246,784** |
| **w220** | her first World Tour 1000 title | 45.9 → **48.1** | $7,277 → **$7,989** | $4,538,055 → **$5,087,219** | $595,911 → **$722,023** |
| **w234** | the Slam final, lost | 56.9 → **58.9** | $11,180 → **$11,979** | $7,707,023 → **$8,401,360** | $1,331,680 → **$1,529,209** |
| **w258** | fame reaches the cap | 100.0 → 100.0 | $34,500 → $34,500 | $32,670,733 (both) | $9,343,456 → $9,710,575 |
| **w314** | the Slam title, at 19 | 100.0 → 100.0 | $34,500 → $34,500 | $32,670,733 (both) | $21,612,700 → $21,786,729 |

The multiple at the same weeks: 7.84× → 8.28× · 8.64× → 9.00× · 11.99× → 12.25× · 13.26× → 13.49× ·
18.21× (both) · 18.21× (both).

**Read the first two rows together and the item is answered.** At the week he bought the brand its
derived worth was 47.5% of what he had just paid for it; with the debut counted it is **96.3%**. His
«около 240к около года и приносил 270 долларов всё это время» becomes about $250k paying **$559** —
the money nearly doubles at the exact week he was looking at. By w220 the row is 21% bigger; by w314
the gap has closed to 0.8%, which is the decay doing its job: a debut is worth a great deal to a
climber and nothing at all to a champion.

### 3.2 ⚠ THE PREDICTION THAT MISSED, AND WHY IT COULD NOT HAVE HELD

The prediction said the wake would move from w166 to the debut. **It does not: the row first rises
again at w166 on both arms**, and that is arithmetic rather than a tuning failure. Fame is
piecewise-DECAYING (§1's closing property): between w138 and w166 the reference career has no dated
event at all, so the floor can only fall, the derived worth can only fall, and the walked row can
only follow it down. The first W500 title is the next dated event, so it is necessarily where the
slope turns — on every arm, at every step size.

What the debut moves is the **DEPTH of the trough**, which is the half of his complaint that is
about money rather than about a date:

| arm | trough | when | first week the row rises |
| --- | ---: | --- | --- |
| FIXED (no debut) | $231,718 | w165 | w166 |
| FIXED + DEBUT w130 | **$243,207** | w165 | w166 |

**−7.3% of what was paid becomes −2.7%.** «упал в цене на вторую неделю и остался там» survives as a
1-in-40 sag instead of a 1-in-14 one, and the brand is earning nearly twice as much while it sits
there.

### 3.3 The step frontier — measured, and the retune is HIS

Since the debut week is reconstructed and the step was written down before the run, both are worth a
sensitivity reading rather than a claim.

**The debut week barely matters.** At every one of the four weeks a Slam can be played in season 2
(`TIERS.slam.anchorWeeks` = [2, 21, 26, 34], season 2 = w104..w155):

| debut | fame @ w138 | income @ w138 | derived @ w138 |
| --- | ---: | ---: | ---: |
| w106 | 13.07 | $514 | $219,707 |
| w125 | 13.51 | $549 | $236,047 |
| **w130** | **13.63** | **$559** | **$240,830** |
| w138 | 13.84 | $577 | $248,937 |

The whole 32-week span moves the answer by 13%. The reconstruction is therefore not load-bearing.

**The step does matter, and the frontier has a number:**

| step | fame @ w138 | income @ w138 | derived @ w138 | vs the $250,000 paid |
| --- | ---: | ---: | ---: | ---: |
| +0 (before) | 9.84 | $291 | $118,874 | 47.5% |
| +3 | 12.69 | $484 | $205,753 | 82.3% |
| **+4 (shipped)** | **13.63** | **$559** | **$240,830** | **96.3%** |
| +5 | 14.58 | $640 | $279,113 | 111.6% |
| +6 | 15.53 | $726 | $320,705 | 128.3% |
| +8 | 17.43 | $914 | $414,165 | 165.7% |

⚠ **The line between «the row still sags a little» and «the row is worth what it cost the week it is
bought» lies between +4 and +5**, and nothing was retuned to cross it. +4 was written down before the
run and is what shipped; the criterion behind it is the ladder (a Slam main draw = one World Tour
250 title = 16% of a Slam title), not this table. If he wants a fresh brand to hold its price
through a debut season, **+5 is the one-line change and it is his**: it also raises a #155 wildcard's
fame by 48% over the shipped step, which is a balance decision about how famous «сыграл Шлем»
should make a teenager, not a pricing one.

## 4. The brand chain, written once

Five links. Each is one function, each is the only place its job is done, and the whole chain draws
nothing and persists nothing except the owned row's own `valueCents`.

**(1) REACH** — `brandReachOf`, `world/brand.ts`

```
reach = min(100, max(fame + contractFame, retention × strength))
```

`strength` (`world/brandStrength.ts`) is the brand's slow stock: the best she has ever been, faded
on a half-life measured in years. `retention` = 0.95, and **it stays below 1** — that is the entire
proof that the top of the shelf cannot move, because strength is pinned to fame at the cap and at
every running peak, so `retention × strength < fame` exactly where the best careers live. The floor
can only bind on the way DOWN, which is the one place the owner asked anything to move.
`contractFame` is INSIDE the max since round 38 #18: outside it, ten points of paper reached 19.5
where ten points of fame reached 10 — one deal paid twice.

**(2) INCOME** — `brandWeeklyGrossCents`

```
weekly¢ = round( (perFamePointCents × reach² / famePivot) × crowdMult )
        = round( (3000 × reach² / 10) × crowdMult )
```

Convex, and the shape is **forced rather than chosen**: hold the calibrated bottom (6.0% a year on
$250,000 at the fame a family can first afford the brand, against an index fund's 7%) and reach the
researched top ($0.5M–$2M a year for a top own-brand), and what is left is convex. This is the
simplest member, pivoted on the anchor itself, so it is identical at `famePivot` = 10 by
construction. `crowdMult` = `clamp(0.9, 1.15, (roomSize / 940)^0.1)` — a bounded quarter-power tilt
centred on 1, on the INCOME and not on the multiple, because being seen is current form.

**(3) MULTIPLE** — `brandMultipleX`

```
x = unknownX + (baseX − unknownX) × (reach / 100)      base ramp:  2.5 → 14
  + 0.2 × min(proSeasons, 12)                          seasons played
  + 0.3 × min(topSeasons, 8)                           seasons ended top-20
  + 0.1 × min(finalsLost, 12)                          finals reached and lost
  + 1.0 × clamp01((winRate − 0.60) / 0.25)             the win-rate window
x = min(20, x)                                                          cap: maxX
```

`baseX` is the **rung's own** `earningsMultipleX` (14 for `merch-brand`) passed in, so the catalogue
keeps exactly one number saying where this rung's pricing starts. ⚠ At fame 100 the ramp IS `baseX`,
so the top of the shelf is identical to the pre-round-32 model for every career — his standing
ruling that the ceiling is not to be cut is satisfied by construction. The win-rate term is a share
of a window: a career below 0.60 adds nothing and is never charged.

**(4) GROSS WORTH** — `brandGrossWorthCents` = `income × 52 × multiple`. A plain product, so
`worth / a year of income` is the multiple again to the cent, bounded by [2.5, 20] at every week of
every career.

**(5) THE OWNED ROW** — `world/assets.ts`. Ownership is applied here and nowhere else (today the
family owns all of it, so it is a multiplication by one that is never written down). Two things
happen at this boundary:

* **the floor**: `derived = max(0.25 × paidCents, gross)` — `ECONOMY.shop.businessValueFloorShare`.
  A fact about the OWNED ROW, not about the brand, which is why it is not in `brandGrossWorthCents`.
* **the incremental walk** (this round's fix, item 18 part one):
  `value += (derived − value) × (1 − 0.5^(1/H))`, `H = worthRampHalfLife(fame, 12.8)` clamped to
  [52, 416] weeks. The accumulator is the row's own persisted `valueCents`. ⚠ **The equivalence is
  telescoping and is not re-proved here**: for a constant half-life the weekly product collapses to
  the shipped closed form exactly — measured drift 4¢ on $156,250 over 416 weekly roundings — so
  every number round 38 #16 measured still describes this path. What the walk removes is the ability
  of a fame that FELL to re-read weeks the family had already lived. See
  `docs/specs/brand-inertia-2026-08.md` §20, and round 41 #18's ledger entry for the bench.
  ⚠ Its one cost is idempotence on this one family: `revalueAssets` run twice in a week double-steps
  a brand. The tick is its only caller; the warning is on that function's own header.

## 5. The rough edges the audit surfaced

Each one is either fixed with a number or named as HIS. None was quietly retuned.

### (a) FOUR of `brandSignalsOf`'s seven terms ignore the week they are asked about

`brandSignalsOf(world, week)` takes a week, and `proSeasons`, `topSeasons`, `finalsLost` and
`winRate` fold over **all** of `seasonHistory` / `trophiesByTier` regardless of it. Only `fame`,
`strength`, `contractFame` and `roomSize` are dated. (The brief named two of these; the audit found
four, which is the reason the audit exists.)

**Live, it is honest and it is not a defect.** Every runtime caller asks about NOW — the shop row,
`revalueAssets`, the Money screen — and at `week = world.week` those four folds are exactly right.
`assetWorthCents` is the one caller that asks about a different week (`week + 1`, to quote «one more
week of holding»), and a season cannot end inside one week, so nothing it asks for can be wrong
either. It is also deliberate that they never DECAY: «a career that happened cannot un-happen» is
this file's stated rule for the four multiple rungs, and it still holds.

**It IS a caveat on any RECONSTRUCTION**, including §3's — asked at w138 the multiple already counts
seasons that had not ended and finals she had not yet lost, which flatters the early `multiple`
column slightly. It cannot manufacture his plateau (fame, income, the floor and the crowd are all
exactly dated, and the plateau is a fame story), and it moves both arms of §3 identically, so every
DIFFERENCE in that table is clean. Stated here, not hidden; **not fixed**, because dating them would
change live behaviour nowhere and would cost four folds on a hot path.

### (b) The fame cap at 100 — the number, and the question is HIS

Measured on the reference career (`tools/r41-brand-history.ts` §5):

| week | capped fame | uncapped | the cap is clipping |
| --- | ---: | ---: | --- |
| w234 (Slam final) | 58.9 | 58.9 | – |
| w249 | 80.0 | 80.0 | – |
| **w258** | 100.0 | 120.7 | **1.21× the ceiling — it starts biting here** |
| w314 (Slam title, at 19) | 100.0 | 192.1 | 1.92× |
| w405 (today) | 100.0 | **194.9** | **1.95×** |

So **148 weeks — nearly three full seasons — of her career are invisible to her own brand**, and the
career being made invisible is the one he calls «эталонный рецепт знаменитости»: world #2, a Slam at
19 (Federer's own age, his words), eleven World Tour 500 titles, seven 1000s. Her income has been
pinned at **$34,500 a week = $1,794,000 a year** for all 148 of them, and her derived worth at
$32,670,733.

**The argument FOR leaving it exactly where it is** is not weak, which is why this is a question and
not a recommendation. $1.794M a year is at the **top of the researched band** for a top own-brand
($0.5M–$2M a year, `docs/research/player-brands-and-what-they-are-worth.md` §7d), so the ceiling is
not an arbitrary clip — it lands an all-time great precisely where the real world says an all-time
great lands, and «superstardom saturates» is a real property of fame. The income curve is `reach²`,
so an uncapped 195 would pay **3.8×** — $6.8M a year, three times the top of the research band — and
`brandMultipleX`'s base ramp is normalised on `ECONOMY.fame.cap` too, so lifting the cap lifts the
ceiling of the multiple as well and the worth would move ~7×. That is the one end round 32 #3 was
forbidden to touch.

**⚠ HIS CALL, and the three shapes, none of them taken:**
1. **Leave it.** Saturation is the design; the reference career is at the top of the real band.
2. **Raise the cap and re-normalise the multiple's ramp on the old 100** so only the INCOME moves.
   A career at uncapped 195 would then pay ~$6.8M/yr — outside the research band, and every number
   he has already approved at the top of the shelf moves with it.
3. **Keep the cap and pay the saturated years somewhere else** — an above-the-cap term that reaches
   the MULTIPLE rather than the income, i.e. «a brand this durable changes hands higher» without
   claiming she sells four times the shirts. This is the only one of the three that leaves every
   approved number where it is, and it is the most work.

### (c) The fresh brand's first three years converge slowly, and that is round 39 #5's floor

At the cap, `worthRampHalfLife(100, 12.8)` = `104 / 7.81` = 13.3 weeks, floored to
`minHalfLifeWeeks` = **52**. So the owned row needs ~5 half-lives to reach a derived worth that
stopped moving 148 weeks ago: at w258 the row reads $9.34M against $32.67M derived, and by w402 it
has reached $29.2M — **89% converged after 144 weeks**. That is the round 39 #5 floor working as
ruled (13 → 52 closed a sell-and-rebuy loop), and the visible consequence is «она в топ-2, а бренд
всё ещё догоняет». Named, measured, **not changed** — the floor is load-bearing for a different item.

## 6. Retroactivity, stated

**Old saves lack the row, and there is no retroactive fame.** `slamDebutWeekOf` returns `null` for
every career that reached a Slam before 12.09, so the debut term is exactly zero for them. This is
deliberate: the alternative is inventing a date, and the reference save proves the date is not
recoverable (§3's own note — her result rows span w353..w405 only, and the earliest Slam evidence
left anywhere in the file is the LOST FINAL at w234).

**What it costs the reference career: nothing.** Her fame has been pinned at the cap of 100 since
w258 and her brand's derived worth at $32,670,733; adding 4 to a floor that is already multiplied
past 100 changes no digit she will ever see. What it costs a career mid-climb on an old save is a
step it never banked — honest, small, and gone in two seasons of play. **New careers get it from
their first Slam.**

## 7. The questions that are HIS, not ours

Three, and every one of them carries its number so the answer costs him a sentence:

1. **The fame cap.** §5(b). His career is clipped 1.95× and has been for 148 weeks. Leave it
   (saturation, and the top of the research band), raise it, or pay the saturated years into the
   multiple instead. **Nothing was changed.**
2. **The debut step.** §3.3. **+4** shipped, sized off the ladder, and it leaves a fresh brand 3.7%
   below what was paid at the purchase week. **+5** would put it above — a one-line change, and a
   decision about how famous playing a Slam should make a teenager.
3. **The feed line.** The debut fires a player-facing milestone row, so it needs a sentence. The
   DRAFT is in the round-41 ledger under item 18 PART TWO and is **his to approve or replace**; the
   fame read does not depend on a word of it.

## 8. What was NOT done, and why

* **No retroactive fame** (§6) — the date is not inventable, and the reference save proves it.
* **No per-appearance term** (§2.4) — it would price the same career twice.
* **No `mainDraws[]` on the trophy shelf** (§2.3) — the cabinet's contract is silverware.
* **No retune of anything measured here.** §3.3's +5 frontier, §5(b)'s three cap shapes and
  §5(c)'s 52-week floor are all written down with their numbers and left alone.
* **No schema move.** `SAVE_SCHEMA_VERSION` = 74, unmoved; no migration, no golden fixture.
* **No frozen-career re-stamp is owed.** Measured rather than assumed: walked at
  `FREEZE_WEEKS` = 156, the three fixture careers reach `w75` at best — `bestFinishByTier.slam` is
  absent on all three — so no fixture career has ever completed a Slam run and no `events` /
  `nextEventId` key can move. See the ledger for the reading.

## 9. Provenance

* Engine: `src/engine/world/fame.ts` (`slamDebutWeekOf`, the floor term, the `fameEventWeeks`
  coupling), `src/engine/world/constants.ts` (`SLAM_DEBUT_KEY`), `src/engine/world.ts` (the fire
  site), `src/engine/economy.ts` (`fame.slamDebutFloor`).
* Tests: `tests/round41-slam-debut.test.ts`.
* Measurement: `tools/r41-brand-history.ts` (predictions in the header, written before the run).
* Ruling: `docs/decisions.md`, 12.09.2026. Ledger: `docs/rounds/round-41.md` item 18, PART TWO.
