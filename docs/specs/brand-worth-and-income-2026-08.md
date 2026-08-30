---
type: spec
status: current
area: economy
canonical: false
last-reviewed: 2026-08-30
---

# The brand: what it earns, what it is worth, and what a career does to both (round 30 #23 + #24)

**His instruction, verbatim:** «Давай математику и динамику оценим и станет понятно всё. У нас есть
её **профессионализм, сколько играет, сколько выигрывает, как глубоко проходит** и вся остальная
информация. Даже то, **сколько зрителей на трибуны приходит**. Всё это можно использовать в расчете
так или иначе.»

And, on the ~$8.7M peak valuation that had blocked #23: «а что с этой цифрой не так? вроде бы как раз
спонсорские коллаборации со спортсменами дают и не такое, а **кратно большее**.»

---

## 1. ⚠⚠ THE BLOCK WAS A WRONG BELIEF, NOT A CONFLICT

Round 30 #23 specified the fix and refused to apply it. The stated reason: the brand's worth is
`earningsMultipleX` × a year of its own income, so **income and worth were one dial** – a convex
income curve that reaches the researched band hands a $250,000 rung an ~$8.7M peak valuation, and
«the two sizing criteria cannot both hold under one multiple».

**Checked against the repo's own research** (`docs/research/player-brands-and-what-they-are-worth.md`):
the RF mark ~$27M (§1, §7c), Sugarpova's peak valuation $20M (§4a), Federer's ~3% of On near $500M
(§3, §7b). **$8.7M for a top-fame player's brand is the modest end of reality.** The criteria never
conflicted. What was real is that **one instrument was doing two jobs**, and that is what this wave
repairs.

## 2. THE SHAPE – two functions over one signal set

| | driver | direction | where |
| --- | --- | --- | --- |
| **INCOME** | fame – titles, lost Slam finals, seasons ended in band, lived shoot weeks | **falls and rises with her** | `brandWeeklyGrossCents` |
| **THE MULTIPLE** | the accumulated career – seasons played, seasons ended top-20, professional finals reached, WTA win rate | monotone; a career that happened cannot un-happen | `brandMultipleX` |
| **WORTH** | a year of the first, times the second | falls when the income falls | `brandGrossWorthCents` |

⭐ **That split is research finding §5.1 written as arithmetic** – «brand value follows the ACCUMULATED
STOCK, not current form» (Sugarpova expanded through a doping ban; EleVen survived thirteen years of
decline; Federer earned $90M in a year he played nothing). **Two careers at identical fame are now
worth different money**, which the old model could not express at any setting.

**The income curve** (`ECONOMY.business.merch.famePivot`, research §7e):

> `weekly = perFamePointCents × fame² / famePivot`, with `famePivot = 10`

Pivoted on the anchor that already measured true – at fame 10 the brand yielded 6.0% a year on its
$250,000 against the index fund's 7% – so it is **identical to the old linear dial at fame 10 by
construction** and diverges only above it. Hold the anchor, reach the band, and the only curves left
are convex.

**The multiple's ladder** (`ECONOMY.business.merch.value`), base `14` on the rung itself:

| his word | signal | per | cap | max lift |
| --- | --- | ---: | ---: | ---: |
| «сколько играет» | finished seasons carrying a WTA end-rank | +0.2 | 12 | +2.4 |
| «она же топ-20 в мире» | seasons ended inside #20 | +0.3 | 8 | +2.4 |
| «как глубоко проходит» | professional finals REACHED AND LOST | +0.1 | 12 | +1.2 |
| «сколько выигрывает» | WTA-track career win rate, as a share of [0.60, 0.85] | +1.0 | – | +1.0 |

Ceiling on the whole multiple: `maxX = 20`.

⚠ **TITLES ARE DELIBERATELY ABSENT FROM THE LADDER.** They are already fully priced into the income
through fame; pricing them again in the multiple is the one-dial defect wearing a new hat. What she
WON moves the income, and how consistently she was THERE moves the multiple.

⭐⭐ **THE DEEP-RUN SIGNAL EXISTS AFTER ALL, AND #24 HAD IT HALF RIGHT.** #24 concluded «`TierTrophies`
stores `titles` and `finals` and NOTHING BELOW a final», which is true and is why a quarter-final
cannot be counted. It does not stop a **final** being counted – and `fameFloorOf` reads `finals` only
at `slam`, so **every lost final from w15 to wta1000 is a dated professional result that nothing in
this game had ever read.** It is read now, into the multiple only.

### 2a. ⚠ THE SIGNALS THAT WERE AVAILABLE AND ARE NOT USED, each with its reason

He said «и вся остальная информация», so the omissions are decisions and are named here rather than
left to look like oversights.

| signal | why not |
| --- | --- |
| `careerTotals.prizeCents` / `earnedCents` | **Circular.** Pricing a brand off the family's money makes a rich family's brand worth more for being rich, and the whole shelf is bought out of that same wallet. What the prize money MEANS – the results that won it – already reaches the brand through fame and through the season bands. |
| `careerTotals.weeksLostToInjury` | **It would be a punishment, and «мы ни за что не наказываем».** Injury already reaches the brand the honest way: through what it costs her on court – fewer seasons, fewer top-20 finishes, fewer finals. ⚠ It is also live ground for a concurrent wave (round 30 #27), and the control arm confirms this change leaves `weeksLostToInjury` identical to the week. |
| `seasonHistory[].bestFinish` | **Not tier-gated.** It is the best finish that season across ALL tables, so a junior title reads as `bestFinish: 0` – a career of junior silverware would rate as a professional deep run, which is exactly what `world/fame.ts`' «the world does not read junior draws» refuses. `TierTrophies.finals` at the professional tiers says the same thing and is gated. |
| `seasonHistory[].points` | Already expressed, better, by `endRank`: points are a raw quantity and the rank is the tour's own sort of them. |
| ~~the crowd~~ | ⭐ **USED since 30.08 – see §5.** It was refused here and the owner overruled it. |

## 3. ⭐⭐ PREDICTED VS MEASURED (invariant 5)

`npx vite-node tools/brand-dynamics.ts -- --seeds 8 --weeks 780` – 9 presets × 8 seeds × 780 weeks,
policy `player`, 30.08. The "old model" column is the pre-30.08 arithmetic read off **the same walk**,
so the before/after is exact and cannot suffer the arm-divergence hazard.

| | predicted | **measured** | verdict |
| --- | --- | ---: | --- |
| day-one worth, median (the #9 criterion) | ≈ $240k, within the −4% the convex anchor costs | **$227,878** vs the old model's $239,757 – **−5.0%** | ⭐ **HELD** |
| day-one multiple, median | ≈ 16 | **15.9** | ⭐ as designed |
| peak income, median career | the §7d band's floor, ~$0.5M/yr | **$711,376/yr** (old arithmetic on the same walk: $105.4k/yr; the round-29 baseline before #24 too: $91.9k/yr) | ⭐ inside the band |
| peak income, best | the §7d band's ceiling, ~$2M/yr | **$1,560,000/yr** | ⭐ inside the band |
| peak worth, median career | ~$11–14M | **$13.46M** | ⭐ |
| peak worth, best | Sugarpova–RF territory | **$31.20M** | ⚠ **above both** – see §4 |
| the multiple at that peak | a real spread, not a saturated cap | p10 **16.4** · median **18.7** · p90 **20.0** | ⭐ the cap binds only at the top |
| worth falls in a LIVE career | more often and deeper than before | **25.7%** of live 52-week windows, median **−29.7%**, worst −50.5% (old model: 26.6%, median −16.3%) | ⭐ **deeper, as designed** |

### 3a. ⭐⭐ ROUND 30 #24 ON ITS OWN – the control arm, run on today's engine

`--bands0` restores the single top-10 rung for one run and changes nothing else, so this isolates the
two new fame bands from the income curve and the earned multiple:

| | one rung (before #24) | **three rungs (shipped)** | |
| --- | ---: | ---: | --- |
| peak fame, median career | 58.9 | **67.5** | +14.6% – reproduces the pre-wave bench exactly |
| peak brand income, median | $540,908/yr | **$711,376/yr** | +31.5% |
| peak brand worth, median | $10.32M | **$13.46M** | +30.4% |
| **worth on the day they buy it, median** | $227,878 | **$227,878** | ⭐⭐ **IDENTICAL TO THE CENT** |
| **the multiple that week, median** | 15.9 | **15.9** | ⭐⭐ **IDENTICAL** |
| live 52w windows where the worth fell | 28.2%, median −32.2% | **25.7%, median −29.7%** | fewer and shallower |

⭐⭐ **THE TWO UNCHANGED ROWS ARE THE ONES THAT MAKE #24 SAFE, and they are unchanged to the cent
rather than approximately.** That is #24's own prediction confirmed: a family reaches first
affordability **before** it has finished top-50 seasons to bank, so nothing the new rungs do can reach
the day-one economics that round 30 #9's multiple was sized against. The lift lands where the owner
asked for it – the **middle** of the distribution; p90 and best were already at the fame cap.

⚠ **THE ONE THAT MISSED ITS PREDICTION WAS THE FIRST DRAFT'S LADDER, AND THE MEASUREMENT CAUGHT IT.**
Base 10 with a ×2.5 win-rate term put the multiple at the `maxX` cap for the **median** career
(p10 17.0 / median 20.0 / p90 20.0) – i.e. worth was a flat multiple of income again for the top half
of the distribution, which is the defect this wave exists to remove. Re-scaled (base 10 → 14, the
lift 14.8 → 7.0, the win-rate window 0.50–0.75 → 0.60–0.85, since almost every career that gets
anywhere already wins 75%+) and re-run. The spread above is the second run.

## 4. ⚠⚠ THE TOP IS FORCED, NOT CHOSEN – AND IT IS HIS TO OVERRULE

⚠ **The figures in this section are the pre-crowd ones ($31.20M / $13.46M); §5d carries the shipped
ones ($35.88M / $15.48M). The argument is unchanged by the crowd term and the levers are the same.**


Two things the owner has already blessed pin it:

1. the day-one anchor – the brand is worth about what it cost at the fame a family can first afford
   it (median fame **9.6**);
2. the convex income curve, which §7e shows is the only family of shapes through both ends.

Together they fix the fame-100 valuation at roughly `price × (100 / 9.6)² ≈ $26M` **before the
multiple moves at all**. Everything above that is the ladder.

Against the research: **above** Sugarpova's $20M peak valuation and the RF mark's ~$27M estimate,
**far below** Federer's ~$500M On equity, and 2.6× the shelf's $12M academy. It is reached by careers
that hold **fame 100 – «the whole world knows her»** – for several seasons; the median career that
ever owns a brand peaks at $13.46M and **2 of 72 careers never reach fame 1 at all**, so their brand
is worth the mark and nothing else. ⭐ P5's bimodality ruling stands: the top shelf is for exceptional
careers and the median is owed nothing.

⚙ **The one dial that would move it without touching either anchor is `maxX`.** 18 puts the best
career at $28.1M, 17 at $26.5M – at the cost of flattening the multiple for reigns, which is where
the decoupling is most visible. Left at 20. **Say a number and it is one line plus a bench re-run.**

## 5. ⭐⭐⭐ CROWD – THE `[GAP]` WAS OVERRULED, AND HE WAS RIGHT

This section used to say crowd could not be used. **The owner overruled it:** «у нас есть понимание
**коридора зрителей на каждом турнире**, мне кажется этого достаточно вполне.»

⭐ **The objection was to the wrong noun.** The filed `[GAP]` said `eventCrowd` is «a corridor per
tier, decorative, read by nothing, never persisted». Two of those are about the **draw** and one is
about the **corridor**, and they are different objects:

- `eventCrowd(seed, event)` is a per-event **roll** off `seed:crowd:<eventId>`. It stays decorative;
  its grep guard in `tests/preview.test.ts` is **untouched and still green**. Reading a roll into a
  valuation would have put a die inside «a fold over history, zero draws».
- `CROWD_BANDS` / `tierCrowdMid` is the **static table under it** – how big the room is at that rung.
  A pure constant. That is what he named, and that is what the brand reads.

### 5a. What is reconstructible, and what is not

⚠⚠ **A career's full watched audience is NOT reconstructible, and that half of the `[GAP]` stands.**
No career-long record of what she **entered** survives: `world.results` prunes at 52 weeks, the news
feed caps at 400 rows, and `seasonEntries` and `proEntryWeeks` are both pruned to the current season.

⭐ **What does survive is `trophiesByTier[tier].titles/finals` – dated, per tier, never pruned.** So
the signal is **the size of the room she reaches finals day in**, which is narrower than «who saw
her» and is the part a save can still answer for. `tests/round30-brand-value.test.ts` §8 round-trips a
world through JSON and asserts the same answer, so it is a signal and not a session artefact.

### 5b. The arithmetic

`BrandSignals.roomSize` = the **recency-weighted MEAN** room over her recorded appearances (titles ∪
finals, every tier she holds a shelf on), decayed on the fame half-life – **the decay cancels between
numerator and denominator**, which is the point. It multiplies the **income** (`brandCrowdMult`),
bounded `[0.90, 1.15]`, centred on `refRoom`.

⚠⚠ **A MEAN AND NOT A TOTAL is the whole reason it is not fame twice.** A decayed total audience is a
decayed sum over the same records the fame floor already sums – it would measure how much she has
done, again. A mean measures **the rooms she is playing in**, which is a fact about her schedule.

⚠ **Juniors are counted here and are not counted in fame, deliberately.** The fame floor ignores
junior draws because *the world* does not read them; the crowd does not care what the world reads. A
J300 draws 900–2,600 and a W15 draws 20–70 – **the professional rung is the smaller room** – which is
`season/preview.ts`' own «the crowd she plays in front of gets smaller as the tennis gets better».

### 5c. ⚠⚠ THE CORRELATION – the test the instruction set, answered honestly

Over **44,506** live career-weeks that carry both a rank and a room:

| | |
| --- | ---: |
| Spearman(room, better rank) | **0.867** |
| Spearman(room, fame) | **0.931** |
| the multiplier itself | p10 **0.90** · median **1.09** · p90 **1.15** |

⭐ **The case for keeping it – the residual is real and it is measured.** At a **fixed rank band**
(#15–35, 14,227 weeks) the room still spans **p10 2,926 – median 8,075 – p90 12,665 people**, a 4.3×
spread at the same place in the table. And the archetypes separate: a reign's median room is **7,541**,
a journeywoman's **2,269**, a late bloomer's **113**.

⚠⚠ **The case against, stated because it is the number that would make him kill it:** the room is
**0.931-correlated with fame**, and fame is what it multiplies. So most of what it does is steepen a
curve that already exists, and only the residual is new. **The instruction's own test named rank
(0.867, not near 1) and asked for the separation to be shown (it is, above), so it ships** – but this
is a term he can delete with one constant, and if he would rather not carry an 0.93-correlated
multiplier for a 4.3× residual, `maxMult = minMult = 1` turns it off with no other edit.

### 5d. Sized against the anchors, not against taste

⚠ **The first two sizings were wrong and the bench said so.** At `exponent 0.25` the term ran
0.85–1.35 with **both clamps binding inside the deciles**, pushed the best career's income to
**$2.106M/yr – through the ceiling of the researched band** – and moved the day-one worth −4.4%. At
`refRoom 1,250` it still left −2.8%. It was carrying the answer, not tilting it.

Shipped at `exponent 0.10`, `refRoom 940`, clamp `[0.90, 1.15]` – **`refRoom` solved backwards from
the criterion**, being the value at which the median day-one multiplier is 1.00:

| the protected anchors | published (§3) | **with crowd** | |
| --- | ---: | ---: | --- |
| day-one worth, median | $227,878 | **$227,886** | ⭐⭐ **HELD** – $8 apart, 0.004% |
| the multiple at peak | p10 16.4 · median 18.7 · p90 20.0 | **identical** | ⭐⭐ **HELD** – crowd is on the income only |
| peak income, best | $1,560,000/yr | **$1,794,000/yr** | still inside the researched $0.5–2M band |
| peak income, median | $711,376/yr | **$818,082/yr** | |
| peak worth, median | $13.46M | **$15.48M** | |
| peak worth, best | $31.20M | **$35.88M** | ⚠ +15% on the figure §4 already flagged as his |

## 6. ⭐⭐⭐ THE FOUNDATION FOR THE COLLABORATION LAYER – what is cheap, and what is not

**The owner:** «по сути этот мерч бренд это **фундамент для этого слоя**.» Collaborations, equity and
royalties are **not built** – «но не сейчас» stands and nothing in the engine implements them. What
this wave leaves behind is a **seam**, and the point of naming it now is that he can price the next
wave before ordering it.

**The seam.** `world/brand.ts` prices a **whole brand** off the career and knows nothing about who
owns it. **Ownership is applied in exactly one place** – `assetWorthCents`' business branch in
`world/assets.ts`, and `assetEarningsRateCents` beside it – where the owned row lives. Today the
family owns all of one, so the share is a multiplication by 1 that is never written down. ⚠ **No field
was added for it**: an unused field is a dead field, which is the same disease as a dead guard.

| future shape | cost against this model | why |
| --- | --- | --- |
| ⭐ **a partner in her own brand** (a stake sold) | **CHEAP – one field, one multiplication** | `share` on the owned row, applied at the ownership boundary. Both income and worth already funnel through the same two functions, so neither arithmetic changes. The brand already has an identity to sell a piece of (round 30 #8's `OwnedAsset.name`). |
| ⭐ **a royalty line on a sponsor** (Djokovic's Asics, $5–10M/yr) | **CHEAP, BUT IT IS NOT THIS RUNG** | It is a percentage of somebody ELSE's revenue and belongs on the ad/kit ladder, which already models exactly that relationship. It can reuse `brandSignalsOf` to rate her, and it needs no change to the valuation at all. ⚠ Building it inside `merch-brand` would recreate the one-instrument-two-jobs defect the research's §7a already names. |
| ⚠ **equity in an existing brand** (Federer's ~3% of On) | **NEEDS DIFFERENT MACHINERY, not surgery on this one** | Its value is marked to market against an external company, not derived from her earnings. That is the engine's **units** valuation (`unitBaseCents` + `unitPriceCents`, `world/market.ts`), which already exists and already moves both ways. The honest build is a **fund-shaped rung whose price is partly driven by fame** – cheap in itself, but it is a third valuation kind and must never be hung off `earningsMultipleX`, which `tests/round30-brand-value.test.ts` §1 already refuses in both directions. |

## 7. WHAT MOVED

- `ECONOMY.business.merch.famePivot` – new; the convex income curve.
- `ECONOMY.business.merch.value` – new; the multiple's ladder.
- `ECONOMY.fame.seasonEndBands` – **round 30 #24 shipped**: `top10=+10` gains `top20=+4` and
  `top50=+1.5`.
- the `merch-brand` rung's `earningsMultipleX` – **16 → 14**, and its meaning is now the BASE.
- `src/engine/world/brand.ts` – new leaf; `world.ts` re-exports it.
- `assetEarningsRateCents` / `assetWorthCents` – read `world/brand.ts` instead of holding their own copy.
- `shopView`'s `earningsMultipleX` – now the CAREER's multiple, whole, so the card's existing sentence
  («Worth N years of what it sells») stays true. ⚠ **The sentence itself is untouched** – invariant 4.
- `tools/brand-dynamics.ts` – new bench; `tools/merch-fame-vs-rank.ts` re-pointed at the engine.
- ⭐⭐ **30.08, the crowd overrule:** `season/preview.ts` exports `tierCrowdMid` (the corridor, never
  the draw – `eventCrowd`'s guard is untouched); `world/fame.ts` exports `decayAt` so the crowd ledger
  decays on the same curve rather than a copy of it; `ECONOMY.business.merch.crowd` is a new block;
  `BrandSignals.roomSize` and `brandCrowdMult` are new.

⚠ **NO SCHEMA MOVE.** Every signal is a fold over records the save already keeps and never prunes
(`seasonHistory[].byTrack.wta`, `trophiesByTier[tier].finals`). `SAVE_SCHEMA_VERSION` stays 67.

⚠ **ZERO MAIN DRAWS.** `world/brand.ts` takes no `Rng`, no clock and no `Math.random`; a valuation is
a fold over history. The frozen capture (41550 / `e6b0c709`) is unmoved and verified.

### 7a. ⭐⭐ THE CONTROL ARM, PER KEY – measured, not argued

A probe walks three careers 260 weeks, **plants a fame stock and buys the brand at week 90** (so the
arm contains the reader – without the titles the career holds fame 0 for 260 weeks and the money path
this wave changed never runs, which is a null result dressed as a null finding), and prints `rngMain`
plus a per-key hash of the whole world. Run on **B** (this branch) and on **A** (the branch point,
which on this branch is exactly «my commits reverted» – nothing else has landed on it).

- ⭐⭐ **`rngMain` is BYTE-IDENTICAL on all three seeds.** The fairness property holds.
- **The keys that moved are the money and only the money**: `assets` (the brand's `valueCents`),
  `fundsCents`, `careerTotals`, `events`, `financeWeeks`, `lastSeasonSummary`, `seasonHistory`, and
  `fork` – whose quotes, tiers, shares and week are **identical**, with only its derived
  `canPayPerYearCents` moving with the wallet.
- **Nothing else moved at all**: the calendar, the cohort, the results, the trophy ledger, the
  ranking keys and `injuryHistory` are byte-identical. `careerTotals.spentCents` and
  `weeksLostToInjury` are identical to the cent and to the week – so this wave does not touch the
  concurrent injury work.
- The one career-total that moved is `earnedCents`: $281k → $628k over 170 weeks of owning a brand,
  which is the item.
- ⭐ **Re-run after the crowd overrule (30.08): `rngMain` still byte-identical on all three seeds, and
  the crowd term moved NO NEW KEYS** – the same money set and nothing else. That is what a term
  reading a static corridor table and a pure decay curve is supposed to look like.
