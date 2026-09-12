---
type: spec
status: current
area: simulation-and-balance
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
* **Since 12.09 the floor has a seventh source: HER FIRST GRAND SLAM MAIN DRAW**, worth
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
| **The cap** | — | `cap` | 100 | — | §7(b) — the open question. |

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

**MEASURED:** see §3. *(filled in from the run — this section was committed before it.)*

## 3. The reference career, annotated — OLD / FIXED / FIXED+DEBUT

*(measured; filled in after §2 was committed)*

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

*(filled in with the measurements — see §7)*

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

*(filled in with the measurements)*

## 8. Provenance

* Engine: `src/engine/world/fame.ts` (`slamDebutWeekOf`, the floor term, the `fameEventWeeks`
  coupling), `src/engine/world/constants.ts` (`SLAM_DEBUT_KEY`), `src/engine/world.ts` (the fire
  site), `src/engine/economy.ts` (`fame.slamDebutFloor`).
* Tests: `tests/round41-slam-debut.test.ts`.
* Measurement: `tools/r41-brand-history.ts` (predictions in the header, written before the run).
* Ruling: `docs/decisions.md`, 12.09.2026. Ledger: `docs/rounds/round-41.md` item 18, PART TWO.
