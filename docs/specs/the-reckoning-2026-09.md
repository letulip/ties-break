---
type: spec
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-09-18
---

# The reckoning – what a career earned and what it cost (round 46 items 9 and 10)

The owner finished a career on 18.09 and read the last page of the game:

> «наша математика затрат и заработков, которая мне по итогам сказала в альбоме, что заработано было
> 13млн (причем вообще не ясно откуда эта цифра), а потрачено 83млн. Я бы хотел сказать, что мы
> как-то некорректно читаем траты на теннис (о которых речь) и заработки. У меня было на момент
> финиша: счет на 10+млн, фонд на 20+млн, все дома, вся академия, мощный бренд, яхты и машины не
> считаю, и помимо этого еще дочери куча призовых и спонсорских. Эта математика критична и ее тоже
> надо починить.»

and, in the same message:

> «некорректный BEST RANK на финале (лучший 27)» – over a career that touched #17.

He is right on every count, and both defects were reproduced and attributed before anything was
changed. The instrument is `tools/album-money-probe.ts`, which is the first measurement in this
repository ever to contain an asset purchase – every bench in `tools/` buys nothing, which is the
whole reason nothing caught this.

---

## 1. Item 9 – the diagnosis

### 1a. Where the two figures came from

| what the player reads | where it came from | what it actually is |
| --- | --- | --- |
| album slot 6, «$X won» (`world/album.ts` `slotTheTurn`) | `careerTotals.prizeCents` | the family's **half** of the prize cheques |
| album slot 6, «$Y spent» | `careerTotals.spentCents` | **every cent that ever left the wallet** |
| epilogue `<dt>Won</dt>` (`EndingScreen.vue`) | the same `prizeCents` | as above |
| epilogue `<dt>Spent</dt>` | the same `spentCents` | as above |
| fork card «Spent so far» (`ForkDialog.vue`) | the same `spentCents` | as above |

Both accumulators are written at one choke point, `accrueFinance` (`world/ledger.ts`): a positive
`amountCents` adds to `earnedCents`, a negative one adds to `spentCents`, and the `'prize'` category
also adds to `prizeCents`. Nothing about the accumulation is wrong; what is wrong is that two of the
three were being printed as though they answered questions they do not answer.

⚠ And `careerTotals.earnedCents` – the only one of the three that IS a total of what came in – is
read by **nothing** in the app. It has never reached a screen.

### 1b. The decomposition, measured

One walked career, `120k · wealthy · elite coach`, seed `bench-wealthy-3`, policy `player`,
1,349 weeks to a natural ending at 39, with a buyer arm that behaves the way he plays (a house, the
merch brand and repeated fund deposits, everything above a $2M float):

```
── EVERY CENT THAT EVER MOVED, GROSS, BY CATEGORY ──
  prize      in    $17,164,973   out             $0
  shop       in             $0   out    $15,490,000     ← the house, the brand, the fund
  business   in     $8,123,050   out             $0
  coaching   in             $0   out     $4,667,679
  travel     in             $0   out     $4,644,519
  income     in     $2,739,567   out             $0
  entry      in             $0   out       $389,250
  vacation   in             $0   out       $315,812
  facility   in             $0   out       $286,632
  physio     in             $0   out        $72,579
  gear       in             $0   out        $52,712
  stringing  in             $0   out        $16,171
  TOTAL      in    $28,027,590   out    $25,935,355
  reconcile: earnedCents == Σin · spentCents == Σout

── WHAT THE FAMILY HOLDS AT THE END ──
  family wallet                             $2,212,235
  her own account (kidFundsCents)          $28,749,334
  assets at value                          $39,327,362   (at cost $15,490,000)
  HOUSEHOLD WORTH                          $70,288,932
```

**The hypothesis was right on both halves.**

* **«Spent» folded in asset purchases.** `'shop'` is **59.7%** of the whole «spent» figure –
  $15,490,000 of $25,935,355 – and every cent of it is sitting in the same save under `assets`,
  worth $39,327,362. That money was **moved**, not consumed.
* **«Won» misses whole streams.** It is `prizeCents`, the family's half of the prize money. It does
  not contain `business` ($8,123,050 – the brand and the academy), `income` ($2,739,567 – the
  parents' wages), and it does not contain **her own account at all** ($28,749,334, which is
  *larger* than the family's prize total). That is the answer to «не ясно откуда эта цифра»: one
  slice of one stream, printed where a reckoning was expected.

His own career is the same shape further along – yachts, cars, all the houses, the whole academy and
a $20M fund built by repeated deposits – which is how the ratio reaches 13 against 83.

### 1c. …and the break-even milestone had the same denominator

`captureBreakEven` (`world/milestones.ts`) gated the album's central page on
`prizeCents > spentCents`. So a family that put its prize money into a fund raised the bar by exactly
the amount it had just banked: **the harder the tennis paid, the further away the turn moved.** The
page and its gate had to move together or the figures would have claimed a crossing the milestone
denied.

## 2. Item 9 – the taxonomy shipped

One reader, `careerMoney(world)` in `world/ledger.ts`, folded once at snapshot time and read by the
album, the epilogue, the fork card and the break-even milestone.

| field | what it is | derived from |
| --- | --- | --- |
| `earnedCents` | every cent that came into the family wallet | `careerTotals.earnedCents`, untouched |
| `prizeCents` | the family's half of the prize cheques | `careerTotals.prizeCents`, untouched |
| `herAccountCents` | every cent the tennis paid HER | `kidFundsCents` (monotone – three writers, all `+=`) |
| `cameInCents` | `earnedCents + herAccountCents` | – |
| `spentCents` | every cent that ever left the wallet, gross | `careerTotals.spentCents`, untouched |
| `heldCents` | the part of it that bought something still owned | `Σ assets[].paidCents` |
| **`outlayCents`** | **`spentCents − heldCents`, floored at 0 – the money that left for good** | – |
| `holdingsCents` | what those things are worth now | `Σ assets[].valueCents` |

> ⭐ **AMENDED 18.09 by ruling 5 (§6.2): a third term, `upkeepCents`, joins the table** – what the
> cars, the boats and the planes have cost to KEEP, replayed rather than read – and `outlayCents`
> becomes `spentCents − heldCents − upkeepCents`, floored at 0. The identity below grows the same
> term. Nothing else in this section moved and no schema moved with it.

**Nothing is persisted and `SAVE_SCHEMA_VERSION` does not move.** Every term is already on every
save: `careerTotals` (v39), `assets[].paidCents` (v63), `kidFundsCents` (v54).

Two design choices worth stating:

* **`paidCents`, not `valueCents`.** What is taken back out of «spent» is the CASH that went in. This
  is also what keeps a SOLD asset honest with no extra bookkeeping: the purchase stays in
  `spentCents` and the proceeds stay in `earnedCents`, the row leaves `assets`, and the pair nets to
  the realised gain or loss – which is right, because a car sold for less than it cost really was
  consumed. A part sale is the same statement smaller (`sellAsset` already reduces `paidCents` by
  the sold part's cost).
* **The identity**, pinned in `tests/round46-career-money.test.ts` rather than claimed:

  ```
  cameInCents − outlayCents === (fundsCents − opening reserve) + heldCents + herAccountCents
  ```

  Measured exactly on the probe career: $46,331,569 on both sides.

### 2a. Predicted vs measured (invariant 5)

| | predicted | measured |
| --- | --- | --- |
| share of «spent» that is asset purchase on a buying career | «most of it» | **59.7%** |
| album slot 6 «spent», same career | falls a lot | **$25,935,355 → $10,445,355** |
| the career break-even, same career | may now cross | **crosses, at W5 '36** |
| a career that buys nothing | byte-identical | **identical** (`heldCents` 0 ⇒ `outlayCents === spentCents`) |
| frozen MAIN capture | unmoved | **unmoved** – `tests/condition.test.ts` green |

⚠ The «0 careers in 216» rarity `SLOT6_EMPTY_WHY` is written from is **untouched**: those careers
were walked before the shelf existed and bought nothing, so their `heldCents` is 0 and their reading
does not move by a cent. What changed is only the career that OWNS something.

### 2b. ⚠ One imperfection, taken knowingly

> ⭐ **RULED 18.09 – he read this note and ruled the imperfection CORRECT.** See §6.2. What the week
> arm excuses along with the purchase turns out to be exactly what he wanted excused, and the career
> arm now subtracts the same cents explicitly. The paragraph below is left as written.

`captureBreakEven`'s **week** arm excludes the whole `'shop'` category, which excuses the shelf's
weekly **upkeep** as well as the purchase – `resolveAssetUpkeep` books a yacht's crew under `'shop'`
too and a week's `byCategory` row is one netted figure, so the two cannot be told apart there. The
**career** arm does not have this problem, because it subtracts `assets[].paidCents` rather than a
category, and upkeep never touches `paidCents`. Two imperfect options and the smaller error taken on
purpose: a deposit is six figures and a week's upkeep is three. The reading it leaves also stands on
its own – that arm asks whether the TENNIS paid for the tennis, and a boat's crew is not the tennis.

## 3. Item 10 – the diagnosis

`buildEndingView` folded `min(seasonHistory[].endRank)`. That field is documented on
`SeasonHistoryEntry.endRank` as «⚠ THE ITF ONE, always – the wrap writes `world.kidRank`». So the
epilogue's «Best rank» was **the best junior year-end**, and it was wrong twice:

* **(a) the wrong table** – a woman who spent twenty seasons on the professional tour was handed a
  junior figure;
* **(b) season closes only** – a peak reached in May and lost by December is invisible, and a career
  that ends MID-season never wrote its last close at all (`maybeFireSeasonWrapUp` fires at week 49 of
  a season and nowhere else).

The album's own best-rank page (`slotBestWeek`'s fallback) had the same table defect in a second
copy: it scanned the `season-rank` milestones, whose `rank` is also `world.kidRank`.

### 3a. Measured – ten walked careers, `tools/album-money-probe.ts --census 10`

```
  preset/seed   ladder   OLD(epilogue)  PROPOSED  TRUE HELD  miss(old)  miss(new)
  8/3   natural  wta      #14    #12    #11        +3    +1
  8/6   injury   wta      #13    #6     #3         +10   +3
  8/8   injury   wta      #21    #1     #1         +20   +0
  8/10  natural  wta      #13    #4     #2         +11   +2
  8/12  natural  wta      #22    #11    #8         +14   +3
  (four careers had not ended by week 1400 and so have no epilogue figure)

  mean miss – OLD 11.6 places · PROPOSED 2.6 places
  worst miss – OLD +20 · PROPOSED +6
```

Seed 8 is the owner's complaint in miniature: the epilogue printed **#21** over a girl who had
actually stood at **#1**.

## 4. Item 10 – what shipped

`bestRankEver(world)` in `world/ladder.ts`, with `bestSeasonClose(world, track)` beside it:

* **the table is `activeLadderOf(world)`** – the engine's own single answer to «which table is hers»,
  the same one Home's chip, the Stats tabs and the wrap-up card read. A «best» that took the smallest
  number across all three tables would be the cross-table comparison `prevRankIn` and the wrap-up's
  movement arrow both refuse: #3 at home at fourteen is not a better standing than #11 in the world
  at twenty-two.
* **the fold is every recorded close on that table, plus the rank she is standing on now** – the live
  term is what sees a final, partial season the wrap never reached. Asked only where
  `kidPoints(track) > 0`, because «unranked is not a number».
* The album's slot 4 reads `bestSeasonClose` on the **same table** but only the CLOSES, because its
  own copy says «at the close of YYYY» and a mid-season standing would make that sentence false. The
  week it derives is the wrap week, so the page's date does not move for any career the old scan
  could see.

### 4a. ⭐⭐⭐ RULED 18.09 – the schema move is REFUSED, and season closes are enough

The version of this section that shipped on 18.09 proposed closing the last gap with **a persisted
running minimum per table**, written in `recomputeKidRank` beside `peakDomesticPoints`, and put it to
the owner as a schema move that was his call rather than an agent's. **He refused it**, and the
refusal is kept here rather than deleted, because a decision not to build something is a decision:

> «достаточно лучшего ранга по итогам сезона, они у нас все есть, можно даже все ранги перечислить из
> каждого уровня чемпионатов отдельно.»

So the reader that shipped **stands as it is**: every recorded close on her table, plus the rank she
is standing on now. The residual miss it leaves (mean 2.6 places, worst 6 – §3a) is the gap he has
chosen to live with, and **it is not to be re-proposed.** The fact behind it is unchanged and worth
restating so nobody rediscovers it as a bug: nothing on any save retains the rank she held in an
ordinary week, `prevKidRank*` keeps one, and a peak that rose and fell inside one season is therefore
beyond any reader. No schema bump, no migration, no golden fixture. **Closed.**

### 4b. ⚠ His second sentence is a NEW ask, and it stops at a proposal

> «…можно даже все ранги перечислить из каждого уровня чемпионатов отдельно.»

**What the world actually records.** Three tables, and all three really are there:
`SeasonHistoryEntry.byTrack` (v46) carries an `endRank` per `LadderTrack`, `bestSeasonClose(world,
track)` already takes the table as an argument, and every table already has a **shipped** player-
facing name in `LADDER_LABEL` – `National`, `International`, `Professional`. So the engine needs
**nothing built**: the reader is written and it is already per-table.

Measured on the probe career (`--arm 0`), which is what the three rows would say:

| table | best season CLOSE | best she ever HELD |
| --- | --- | --- |
| National | #10 | #3 (w56) |
| International | #14 | #8 (w120) |
| Professional | #12 | #11 (w416) |

and that is the argument for the ask in one table: the single number the page prints today (#12) says
nothing about the child who was third in the country at fourteen.

⚠ **Two things make this HIS call rather than a build, which is why it stops here.**

1. **It is a layout decision.** The epilogue's `<dl>` has ONE `Best rank` row; this makes it three,
   on a page that already grew two rows this wave and has to hold at 375px.
2. **It needs new copy, because `Best rank` cannot survive the change.** Three rows labelled
   `National` / `International` / `Professional` with the grouping word gone read as her CURRENT
   standings, not her bests. Every way out of that is words he has not written.

**Drafts, for his pass** – one row per table, replacing the single `Best rank` row, and each rendered
only when that table has a close to show (a career that never left the national ladder keeps one row,
which is the page it already has):

| # | home | the draft label | value |
| ---: | --- | --- | --- |
| R46-4 | `EndingScreen.vue` · the totals `<dl>` | `Best at home` | `#10` |
| R46-5 | the same `<dl>` | `Best in the world` | `#14` |
| R46-6 | the same `<dl>` | `Best as a professional` | `#12` |

⚠ These are **DRAFTS and nothing is built against them.** An alternative he may prefer, and which
costs one row instead of three: keep `Best rank` exactly as it is and let its value carry the list
(`#3 National · #8 International · #11 Professional`) – fewer rows, but a longer line and a
separator character that is also new copy. ⚠ One content caveat either way: `byTrack` is v46 and
optional, so a career migrated from before it can only answer for the International table; those rows
would show one line, correctly, rather than a wrong number.

## 5. Strings

No shipped string moved. Two new epilogue rows are DRAFTS awaiting the owner's pass – see
`docs/plans/life-wave-7-strings-2026-09.md` §7, ids R46-1 and R46-2 – and both render only when the
figure is non-zero, so a career that owned nothing and was never paid a cheque of her own sees
exactly the page it saw before.

One wording MISMATCH is carried for him rather than fixed: the epilogue's «Won» is still the
family's half of the prize cheques, because the gross cannot be derived (her share left before the
wallet saw it and `accrueKidShare`'s own note forbids reconstructing money by dividing a rounded net
by a rate). A draft is proposed in the strings table.

### 5a. ⭐⭐⭐ RULED 18.09 – «Won» becomes the family's share

He took the draft (R46-3) rather than the explanation:

> «да, пойдет»

> ⭐ **AND HE SPELLED IT HIMSELF LATER THE SAME DAY (ruling B, §5b): `Family's share`, without the
> article.** The paragraph below is left exactly as written, because it is the record of the first
> spelling; what is in the tree is the second.

So the epilogue's first totals label is now **`The family's share`**, and the FIGURE under it did not
move – it is the same `prizeCents`, folded the same way. The mismatch above is therefore closed by
naming the number honestly rather than by inventing a gross that cannot be derived.

⚠ **The rename is that label and nothing else.** Two other surfaces print the same figure and neither
is the string he ruled on: `ForkDialog.vue`'s label is «The tennis has paid», and the album's slot 6
says «$X won against $Y spent» in prose. Widening a ruling about one label to every surface that
happens to share its figure is the agent-initiated wording change invariant 4 forbids. The other four
labels on the page – `Spent`, `Seasons`, `Best rank`, `Titles` – are untouched, and R46-1 / R46-2 are
still DRAFTS awaiting his pass.

### 5b. ⭐ RULING B, 18.09 – the article goes, and he wrote it himself

> «давай Family's share напишем?»

So the shipped label is **`Family's share`**. One word, his own, at the one surface that carries it;
`docs/plans/life-wave-7-strings-2026-09.md` R46-3 records the ruled spelling and the date, and the
mounted pin moved with it under a dated note.

⚠ **Nothing else moved on this ruling either.** The figure is still `prizeCents`, folded the same
way; `ForkDialog.vue` still says «The tennis has paid» and the album's slot 6 still says «$X won
against $Y spent» in prose. §5a above is kept as the record of the FIRST spelling rather than
rewritten – the same discipline §4a keeps for the refusal.

---

## 6. ⭐⭐⭐ The owner's rulings of 18.09, on everything above

He read the spec the day it shipped and ruled on six questions in it. What follows is the record;
the sections above are left exactly as written, because they are what was true when he was asked.

### 6.1 The shelf, classified – the fact all of it turns on

The question §2b left open («which `'shop'` cents are which») could not be answered until the shelf
was actually read. It has **22 rungs in seven families**, and the families are a closed union
(`ShopItem.family`), so every rung present and future lands in one of them:

| family | rungs | charges upkeep? | earns? | what it is |
| --- | --- | --- | --- | --- |
| `car` | 4 | **yes** – 500–900 bps, growing 600 bps a year | no | personal property |
| `house` | 4 | no | no | personal property |
| `boat` | 4 | **yes** – 600–1000 bps | no | personal property |
| `plane` | 3 | **yes** – 800 bps | no | personal property |
| `business` | 1 (`merch-brand`) | no | **yes** (`'business'`) | the brand |
| `academy` | 4 stages | no | **yes** (`'business'`) | the academy |
| `investment` | 2 (`deposit`, `index-fund`) | no | value only | not spending at all |

⚠ **Two facts fall out of that table and both are load-bearing.** First, **every rung that charges
upkeep is personal property** – there is no academy wage bill and no brand upkeep – so the
«a yacht's crew cannot be told from an academy's wage bill» problem §2b worried about **does not
exist**: nothing to tell apart. Second, the upkeep is not small. On the walked shelf of his own
sentence it is **$6,360,802**, 15.3% of that career's whole «spent».

### 6.2 ⭐ RULING 5 – personal property's upkeep leaves «spent» too

> «вообще не про теннис, мимо (машины, дома, яхты, самолеты). Мне кажется это уже не теннис, честно
> говоря. За уши можно притянуть, но лучше нет.»

His four words are the four families. §2b's «one imperfection, taken knowingly» is therefore **ruled
correct in the week arm** – what that arm excuses along with the purchase is exactly what he asked to
have excused – and the **career** arm now subtracts the same cents explicitly.

`CareerMoney` gains a **third** term, `upkeepCents`, rather than a wider `heldCents`, because upkeep
is not held: the money is gone, and what the ruling says about it is not «the family still has it»
but «it is not the tennis». The identity keeps its books with the extra term:

```
cameInCents − outlayCents === (fundsCents − opening reserve) + heldCents + herAccountCents + upkeepCents
```

**It is replayed, not read, and no schema moves.** Nothing on any save is a career total of upkeep –
`resolveAssetUpkeep` books it as an ordinary `'shop'` expense, and `financeWeeks` prunes at sixty
weeks – so `careerAssetUpkeepCents` runs the till's own `assetUpkeepCents` again over the weeks the
thing has been here. That is exact for a thing still held, because `paidCents` on an upkeep-bearing
rung cannot move (all are `stake: 'fixed'`), the clock is the same `assetHeldWeeks`, and the
rounding is once a week in both places.

⚠ **The first billed week differs by kind of rung, and it was measured rather than reasoned.** A
commissioned boat ARRIVES inside a tick (`deliverAssets` runs before `resolveAssetUpkeep`, and
`basisWeek = readyWeek`), so its first billed week is held-week **0**; a car bought off the shelf
arrives through a player command between ticks, on a week already billed, so its first is **1**.
Walked worlds bill a `boat-launch` and a `plane-small` 21 times over 20 held weeks and a
`car-sensible` 40 times over 40. The first fold missed this and over-counted the probe career by
**$693** – three cars' first week, to the cent.

⚠ **The residual, named:** the upkeep of a thing already **SOLD** leaves no row to replay from, so
those cents stay inside «spent». Same shape and same direction as the sold asset's purchase already
takes – this can only ever excuse too little, never too much.

### 6.3 ⭐ RULING 3 – vacations STAY inside «spent»

> «да, восстановление же»

The `vacation` category ($315,812 on the probe career, §1b) is **not** touched and is not to be
re-litigated. A holiday is recovery; recovery is part of what the tennis costs.

### 6.4 ⭐ RULING 4 – tuition STAYS inside «spent»

> «капля в море, ни на что не влияет, пусть останется»

The `tuition` category (`world/college.ts`) is **not** touched. His own reason is the whole of it and
is recorded here so nobody spends a wave on it: it is a drop in the ocean and changes nothing.

### 6.5 ⭐ RULING 6 – the brand and the academy count on BOTH sides

> «А вот бренд и академия вполне могут быть и расходами и доходами, здесь не вижу противоречий.»

So they are deliberately **absent** from `PERSONAL_FAMILIES` and get no concession anywhere. What
this changed, and what it could not:

* **The reckoning's income side already obeyed him.** `careerTotals.earnedCents` – and therefore
  `cameInCents` – counts every positive ledger row including `'business'`, so the brand's and the
  academy's income has been inside «earned» all along.
* **The break-even WEEK arm now counts both sides.** It reads a `FinanceWeek` row, and that row
  carries `'business'` income beside everything else, so the numerator is now `prize + business`.
  Its costs gained the other half: an enterprise stage bought **that week**, read off
  `assets[].boughtWeek` because the week's `'shop'` row is one netted figure and cannot tell a
  clubhouse from a yacht.
* **The break-even CAREER arm is HELD, and the reason is measured.** ⚠ It can see the enterprise's
  cost and **not** its income: `careerTotals` keeps earned, spent and prize and nothing per category,
  and `financeWeeks` – the only place a category survives – prunes at sixty weeks, so a fifteen-season
  total of what the brand and the academy earned is **on no save and cannot be derived from one**.

  Charging the cost with no credit for the income is the one-sided reading he did not ask for, and
  it is not a small error. Measured on `tools/album-money-probe.ts --arm 1`:

  | | figure |
  | --- | --- |
  | enterprise cost (brand + four academy stages) | $12,250,000 |
  | `'business'` income those same things produced | **$34,087,161** |
  | «spent» as it now reads | $9,997,902 |
  | «spent» if the cost alone were charged | $22,247,902 |
  | the album's central page, against $17,158,081 of prize money | **stops crossing at all** |

  So the page would tell a family whose academy and brand earned $34M that the tennis never paid for
  itself. **Closing it is a persisted career total of `'business'` income** – a new `careerTotals`
  field, i.e. the seven-part schema rite – and that is the owner's call, not an agent's. Until then
  the enterprise is NEUTRAL in the career gate, which is the only way to keep his «both sides» true
  when only one side can be seen.

### 6.6 Measured, before and after (invariant 5)

Two walked arms of the probe. **Arm 0 is the one §1b was written from and it is unchanged to the
cent** – it owns a house, the brand and $15,000,000 of index fund, and nothing on it has upkeep,
which is exactly why arm 1 had to be built.

| | arm 0 (the §1b career) | arm 1 (the shelf of his own sentence) |
| --- | --- | --- |
| rungs owned | 3 | 14 – all four houses' worth, three cars, two boats, a plane, the brand, the whole academy |
| `careerTotals.spentCents` | $25,935,355 | $41,608,705 |
| `'shop'` out, gross | $15,490,000 | $31,610,802 |
| – of it, held at cost | $15,490,000 | $25,250,000 |
| – of it, upkeep (ledger's own figure) | $0 | $6,360,802 |
| – of it, upkeep (`careerAssetUpkeepCents`) | $0 | **$6,360,802 – exact** |
| «spent» BEFORE these rulings | $10,445,355 | $16,358,705 |
| «spent» AFTER | **$10,445,355** (unchanged) | **$9,997,902** |
| album slot 6 | unchanged | `W5 '36 – $17,158,081 won against $9,997,902 spent` |
| the identity | holds | holds, with the third term |
| frozen MAIN capture | unmoved | unmoved |

⚠ The replay reproducing the ledger's own $6,360,802 **to the cent** over 1,349 weeks and fourteen
rungs is the measurement that makes ruling 5 a decomposition rather than an estimate.

---

## 7. ⭐⭐⭐ RULING A, 18.09 – the reckoning is TENNIS ONLY, and the portfolio is its own line

He read §6 the same day and ruled again, on the shape all of it produced:

> «давай оставим только расходы на теннис и призовые с тенниса тоже здесь. А отдельной строчкой
> напишем целиковый срез портфеля семьи по деньгам в кошельке и всем магазине на круг – это будет
> проще?»

**This SUPERSEDES ruling 6** (§6.5, the brand and the academy on both sides). And it is simpler in
exactly the way he suspected: a portfolio is a **point-in-time read** of what exists now, not a
lifetime accumulation, so the persisted `careerTotals` field that §6.5 held the career arm at –
a career total of `'business'` income – **is not needed and is not owed**. No schema moves.

### 7a. ⚠⚠ The spend side did not move one cent, and that is measured

The ruling asks for the brand's and the academy's costs to leave «spent». **They were never in it**,
and not by anybody's intent: `heldCents` folds `assets[].paidCents` over **every** row with no family
filter, so an enterprise's purchase has been excused by the very line that excuses a house since the
fix shipped. Ruling 6's own note calls this «`heldCents`' one concession». Walked on
`tools/album-money-probe.ts`, before and after this ruling:

| | arm 0 (§1b's career) | arm 1 (the shelf of his own sentence) |
| --- | --- | --- |
| enterprise held at cost | $250,000 | $12,250,000 |
| `outlayCents` BEFORE ruling A | $10,445,355 | $9,997,902 |
| `outlayCents` AFTER ruling A | **$10,445,355** | **$9,997,902** |
| `prizeCents` («Family's share») | $17,164,973 | $17,158,081 |
| album slot 6 | unchanged | unchanged |
| frozen MAIN capture | unmoved | unmoved |

So «spent» already is what he asks for: coaching, travel, entries, kit, physio, stringing, the
staff's wages and – rulings 3 and 4, which stand – the vacations and the tuition.
`tests/round46-career-money.test.ts` pins this directly («spent» DID NOT MOVE under ruling A) rather
than leaving it as a claim, because a null result is a claim like any other.

⚠ **The residual, named again rather than quietly widened:** a brand that has been **sold** leaves no
`assets` row, so its purchase falls back inside «spent» – exactly as a sold house's does under
ruling 5. Closing it is a persisted accumulator, i.e. a schema move, and the miss is in the
conservative direction either way.

### 7b. Where ruling 6 actually lived, and what changed there

The **only** place ruling 6 was implemented is `captureBreakEven`'s **week** arm, and both of its
halves left together:

| | under ruling 6 | under ruling A |
| --- | --- | --- |
| the week's numerator | `prize + max(0, business)` | **`prize`** |
| the week's costs | non-holding categories **+ `enterprisePaidInWeekCents`** | non-holding categories |

A merch cheque is not the tennis paying for itself and founding the brand is not a week's tennis
costing money – which is the question that arm's own header has always asked. `enterprisePaidInWeekCents`
survives in `world/assets.ts` with its reasoning intact (it is exact for one named week) and has no
caller today.

⚠ **This retires §6.5's open schema question.** With the enterprise out of both arms, the week arm and
the career arm agree with no accumulator and no migration. **It is not to be re-proposed.**

### 7c. The portfolio's composition, and the one question flagged for him

`CareerMoney.portfolioCents` = **`fundsCents + holdingsCents`** – the wallet, plus every shelf row at
this week's worth. The fund and the deposit are in it **without being named**, because an
`investment` rung is an ordinary `assets` row; that is also why `holdingsCents` is the right term and
a third fold would have been a second spelling of it.

Measured on the two arms:

| | arm 0 | arm 1 |
| --- | --- | --- |
| family wallet | $2,212,235 | $12,496,104 |
| shelf at value | $39,327,362 | $45,861,814 |
| **`portfolioCents`** | **$41,539,598** | **$58,357,918** |
| her own account, deliberately NOT in it | $28,749,334 | $28,744,507 |
| (the probe's «household worth», which IS the wider reading) | $70,288,932 | $87,102,425 |

⚠⚠ **Her account is out, and it is a reading of his sentence rather than an omission.** He asked for
«портфель **семьи**» and named exactly two things – the wallet and the shop. `kidFundsCents` is
neither: it is the money the tennis paid **her**, it is the figure this whole round exists because he
could not place it, and the epilogue already gives it a row of its own (R46-1). Folding it in would
print the same cents twice on one list.

> ⚠ **FLAGGED FOR HIM.** If «портфель семьи» means the household's whole worth, this is one term –
> `+ herAccountCents` – and the «Her account» row goes. Both readings are honest; the narrower one is
> the one his two nouns name.

⚠ **`portfolioCents` is not floored.** A family under water reads negative, which is true.
`outlayCents`' clamp exists for the v38 → v39 undercount, which is a different fact.

### 7d. Strings

One NEW row on the epilogue, a **draft**: `Family's portfolio`
(`docs/plans/life-wave-7-strings-2026-09.md` R46-7). The article is dropped to match the row he
renamed four lines above it (ruling B, §5b). It renders on **every** career, unlike R46-1 / R46-2 –
a family that owns nothing still has a portfolio and it is the wallet.

⚠ **Open, and his:** `Still owned` (R46-2, itself a draft) is now a strict subset of the portfolio
row and the two differ only by the wallet. Dropping R46-2 would be tidier and is **not** done here,
because nothing asked for it.
