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

### 4a. ⚠ WHAT IS STILL NOT FIXED, AND IS THE OWNER'S CALL

**Nothing on any save retains the rank she held in an ordinary week.** There is no rank history;
`prevKidRank*` keeps one week. So a peak that rose and fell inside one season is beyond ANY reader,
and the residual miss measured above (mean 2.6 places, worst 6) is exactly that gap.

Closing it is **a persisted running minimum per table** – one `{domestic, itf, wta}` record of
minimums, written in `recomputeKidRank` beside `peakDomesticPoints`, which is the existing precedent
for a never-decaying high-water mark. That is a **schema move: the seven-part rite** (bump +
append-only migration + golden fixture + regenerated e2e fixtures + doc-facts sentence +
frozen-career peel rung + the golden-saves README row), and it cannot be back-filled – a migrated
career's minimum can only start from what `seasonHistory` still holds. **It is not built.**

## 5. Strings

No shipped string moved. Two new epilogue rows are DRAFTS awaiting the owner's pass – see
`docs/plans/life-wave-7-strings-2026-09.md` §7, ids R46-1 and R46-2 – and both render only when the
figure is non-zero, so a career that owned nothing and was never paid a cheque of her own sees
exactly the page it saw before.

One wording MISMATCH is carried for him rather than fixed: the epilogue's «Won» is still the
family's half of the prize cheques, because the gross cannot be derived (her share left before the
wallet saw it and `accrueKidShare`'s own note forbids reconstructing money by dividing a rounded net
by a rate). A draft is proposed in the strings table.
