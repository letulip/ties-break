---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The shop block

The comment essays that stood above the `shop` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `shop`

```ts
  /** ⭐⭐ THE SHELF (slice 1, docs/specs/the-shop-2026-08.md §3a/§3b/§3c). The parent's own money,
   *  and the first screen in this game where it is his to enjoy.
   *
   *  ⚠⚠ A CONSTANT AND NOT SAVE DATA, which is the whole reason it lives here (spec §5). Only what
   *  the family OWNS persists (`WorldState.assets`), so adding a rung – or the whole elite ladder of
   *  §3f – is a catalogue edit and not a migration. An owned row whose id has left this list is the
   *  one case that needs care, and `shopItem` returns undefined for it rather than throwing.
   *
   *  ⚠ `annualRateBps` IS SIGNED AND THE SIGN IS THE POINT. Negative is a thing that loses money,
   *  and §3b says why the game needs some: «THIS FAMILY EXISTS TO LOSE MONEY AND THAT IS THE POINT.
   *  If everything on the shelf appreciates, the shop is a savings account with pictures.» Basis
   *  points rather than a percentage so the table is integers all the way down; the fraction appears
   *  once, inside `assetValueCents`.
   *
   *  ⚠ SLICE 1 IS STATIC, AND «STATIC» MEANS DETERMINISTIC RATHER THAN FROZEN. Every value below is
   *  arithmetic on `boughtWeek` and draws NOTHING – no drift (§4, slice 2), no shock, no freeze. A
   *  car still loses its 9% a season, because otherwise acceptance §2e-1 («the ledger shows the loss
   *  to the cent») has no loss to show and the shelf teaches nothing. */
```

## `shop.catalogue[0].annualRateBps`

```ts
        // ⭐⭐⭐ ROUND 29 PART TWO #3 – 200 → 317 BPS, AND IT IS HIS RULING, NOT A TUNING.
        //
        // «не вижу проблем сделать ставку 3.17% на Savings.»
        //
        // ⚠⚠ 3.17% IS NOT A NEW NUMBER – IT IS THE OLD ONE, MOVED. It is exactly what the current
        // account used to pay automatically every week (`ECONOMY.savings.apyWeekly: 0.0006`
        // annualised, deleted by round 29 #12 – the note where it stood is ~1,300 lines up in this
        // file). #12's own measurement is why he was asked: at 200 bps the deposit recovered only
        // **63%** of the wage it replaced, so the replacement was not a replacement. His earlier
        // ruling binds the two – «мы для этого делаем Savings как раз. Одни должны друг друга
        // заменить» – and a replacement that pays two thirds of what it replaced does not.
        //
        // ⚠ THE OTHER HALF OF THE GAP WAS NEVER THE RATE, and part two #6 closes it: the shelf was
        // SHUT in the junior years, which is the horizon where the removal bites cleanest. No rate
        // fixes a locked door; both were needed and both are his.
        //
        // ⚠ THE INDEX FUND IS UNTOUCHED at 700 bps. He named Savings, and #12's «the fund would
        // recover 221%» is exactly why widening this by hand would have been the tuning he did not
        // ask for. The fund's own under-pricing stands as round 29's ask 11b.
```

## `shop.catalogue[0].unitBaseCents`

```ts
        // ⭐⭐ ROUND 30 #14 – A DEPOSIT IS HELD IN UNITS TOO, AND IT IS HIS OWN EXPECTATION, ROUND 29
        // #11: «Index fund хотелось бы иметь возможность докупать, предполагаю, что Savings deposit
        // будет вести себя так же – тоже надо исправить.» Adding to a holding and taking part of one
        // out is what `stake: 'open'` MEANS, and a holding you can do both to is a holding measured
        // in units. That is what let the rebase be deleted outright rather than kept for one rung.
        //
        // ⚠⚠ AND NOT ONE CENT OF THE DEPOSIT MOVED, WHICH IS ARITHMETIC AND NOT LUCK. With no
        // `volBps` this unit's price is `1000 × 1.0317^years` dead flat (`marketIndex` answers
        // exactly 1), and `units × price` is identically the `(basis + top-up) × (1+r)^t` the rebase
        // computed – rebasing at today's worth WAS the unit model, written the long way round. The
        // deposit's arm in `tests/round30-fund-units.test.ts` measures that equality rather than
        // trusting it.
        //
        // ⚠ $1,000 IS ITS OWN MINIMUM STAKE, chosen so the dullest rung on the shelf quotes the
        // roundest possible price. Nothing depends on the number: units are fractional, so a $1,000
        // opening stake buys exactly one and a $1,500 one buys one and a half.
```

## `shop.catalogue[1].entryCents`

```ts
        // ⭐⭐⭐ ROUND 42 #13 – $5,000 → $1,000, AND THE REASON IS THAT NOTHING EVER DEFENDED THE
        // $5,000. THE OWNER, 15.09: «в индексный фонд можно только от 5к зайти, мне кажется это
        // необосновано.» He is right about the record: the deposit's own $1,000 carries an argument
        // in this file («chosen so the dullest rung on the shelf quotes the roundest possible
        // price»), and this number carried none at all – it arrived with §3a's liquidity ladder as
        // a shape, not as a measurement, and no bench, spec or ruling has ever cited it.
        //
        // ⚠ ONE FLOOR FOR BOTH OPEN RUNGS NOW, which is what makes this a one-line change: the
        // shelf's «ONE MINIMUM, NOT TWO» law (`world/shop.ts`) already holds a TOP-UP to the same
        // floor as the opening stake, so top-ups drop to $1,000 with it and there is no second
        // threshold anywhere to keep in step.
        //
        // ⚠ AND NOTHING ELSE MOVES, BECAUSE FRACTIONAL UNITS ARE ALREADY THE SYSTEM'S OWN
        // ARITHMETIC. `buyAsset` divides cents by this week's unit price with no rounding and no
        // floor (`units = paidCents / price`), which is round 30 #14's whole design – «доли дадут
        // возможность расти на горизонте и будут давать разные точки входа». At `unitBaseCents
        // 4_000_00` a $1,000 entry is 0.25 of a unit, and the screen already prints two decimals
        // (`formatUnits`) precisely because a part unit is a real holding.
```

## `shop.catalogue[1].annualRateBps`

```ts
        // ⭐⭐⭐ ROUND 29 PART THREE #16 – THE DRIFT, AND IT DID NOT MOVE.
        //
        // THE OWNER: «Механику фонда надо придумать, да, потому что безрисковые 3 против безрисковых
        // 7 это весьма странно. Давай подумаем как это можно сделать красиво и просто.»
        //
        // ⚠⚠ 700 IS NOW THE LONG-RUN FIGURE RATHER THAN THE WEEK'S, and that is the whole reason the
        // number is untouched. The market rides EITHER SIDE of this curve (`volBps` below); the
        // headline the shop card prints is where a holding ends up, not where it stands. Round 29
        // #12's «the fund would recover 221%» measurement and the 11b under-pricing question are
        // therefore still answered by exactly this number.
```

## `shop.catalogue[1].volBps`

```ts
        // ⭐⭐⭐ ...AND THIS IS THE RISK. See `world/market.ts` for the path and `ShopItem.volBps` for
        // what the field means. 1,800 bps of log-volatility.
        //
        // ⚠⚠ 1,800 IS A CEILING BEFORE IT IS A TUNING, AND THE ARITHMETIC IS WHY. `marketWave` is
        // bounded in [-1, 1], so the worst the market can ever do to a holding is `e^(-2·vol)`, and
        // the fund beats the 3.17% deposit at ten years for EVERY seed and every entry week exactly
        // while `1.07^10 · e^(-2·vol) > 1.0317^10` – which solves to `vol < 1,824 bps`. Above that
        // the fund becomes a trap for a player who did not read carefully, and «мы ни за что не
        // наказываем» is house law. This sits just under the line, deliberately: it is the most risk
        // the design can carry and still be safe to hold.
        //
        // ⚠ AND IT IS ABOUT HALF A REAL INDEX'S VOLATILITY, which is a decision and not a mistake. A
        // true 17% is a random walk's number, and a walk would put roughly a quarter of ten-year
        // holdings behind the deposit.
        //
        // ⭐⭐⭐ THE CRASH LAYER RIDES ON TOP SINCE HIS EXTENSION OF 29.08 («например раз в 3-5 лет и
        // стартовый сезон уже может быть как раз с -20%») – a crisis every 2-6 years centered on
        // four, -15…-30% at the trough with a recovery arc, no grace period. The construction and
        // its own knobs live in `world/market.ts`; this rung participates because it has a volBps,
        // at full depth (a crisis is not a bigger wobble – the reasoning is at `marketIndex`).
        //
        // ⚙ MEASURED, `npx vite-node tools/market-probe.ts --seeds 4000` (29.08, crash layer IN),
        // 228,000 rolling seasons, 48,000 holdings per horizon, 16,000 crises:
        //
        //   crises            mean interval 4.01y (75.2% in his 3-5y band) · median depth −22.5%
        //   first-season fall 49.7% of careers («стартовый сезон» – exactly his ask)
        //   negative seasons  30.8%   (the wave alone was 19.9% – his crises are the difference;
        //                              the knob back toward one-in-four is THIS volBps, his call)
        //   worst season      −39.9%  (a deep crash landing on a bad wave year; sd 16.79%)
        //   beats the deposit 1y 57.15%  3y 84.03%  5y 86.75%  10y 98.90%
        //   ⚠⚠ the 10y tail   529 of 48,000 (1.10%) – EVERY one sold inside a crash arc; selling
        //                     in calm waters ten years is still universal (the two-tier bound,
        //                     `worstCrashFreeRatio` / `worstMarketRatio`), so «мы ни за что не
        //                     наказываем» reads: holding through a crisis costs nothing, only
        //                     selling into one can lose, at this measured rate. HIS number to
        //                     accept – docs/specs/the-shop-2026-08.md §14h puts it in front of him.
        //
        // The shape is the design: WHEN you sell matters, WHETHER you were right to hold does not.
        //
        // ⚠ PROVISIONAL BY HIS OWN FRAMING: «вроде посмотрел, давай сделаем, а я пощупаю и скажу
        // свои ощущения потом.» Move this one number and re-run the probe; nothing else has to move.
        //
        // ⭐⭐⭐ HE PLAYED IT AND MOVED IT – ROUND 30 #14, 1_800 -> ROUND30_VOL_BPS.
        //
        // «Волатильность индексного фонда какая-то очень большая по ощущениям +65/-15 это то, что я
        // видел… Во-первых она скорее всего будет менее "галопирующая", во-вторых вряд-ли в таких
        // крайностях.»
        //
        // ⚠ THE KNOB THE SPEC ALREADY NAMED FOR THIS, and §14h named the direction too: «If he wants
        // back toward one-in-four WITH crashes, the wave's volBps comes down – his call, one knob.»
        // It is his call and this is him making it. His crash band is UNTOUCHED: −15…−30% at the
        // trough is his own number from the day before and not mine to shave.
        //
        // ⚠⚠ HALVED, AND «HALF» IS THE RULING RATHER THAN A FITTED NUMBER. 1,800 -> 900 is a
        // sentence he can hold («half the wobble»); 1,050 or 875 would be a number nobody could
        // defend later. It lands the felt figure back where he approved it: 24.5% of seasons
        // negative – «roughly one year in four» – against 30.9% before, with a season sd of 15.0%
        // which is about a real index's own.
        //
        // ⚠ AND THE CEILING IS UNMOVED AND UNTOUCHED BY THIS: §14c's inequality caps `volBps` at
        // 1,824 for the ten-year calm-water guarantee, and coming DOWN can only widen the margin.
        //
        // ⚙ MEASURED, `npx vite-node tools/market-probe.ts --seeds 4000` (30.08) – see §14i.
```

## `shop.catalogue[2]`

```ts
      // ⚙ 26.08, the owner: «давай гэп сделаем скромнее пока что от 60 до 300к». A five-fold spread
      // rather than the twenty-two-fold one the first draft drew – from $60k to $300k every rung is
      // a real decision for a real career, and the ladder can always be extended upward later.
      //
      // ⭐⭐⭐ ROUND 30 #15 – AND NOW THEY COST SOMETHING TO KEEP, AND IT GROWS.
      //
      // THE OWNER, 30.08: «Для машин вполне можно ввести годовую стоимость обслуживания, которая
      // может с каждым годом немного расти, как в реальности, пока стоимость авто на рынке падает.»
      //
      // ⚠⚠ WHY THE CARS HAD NONE UNTIL NOW, because it was a decision rather than an omission: §3f's
      // «годовое обслуживание» table is written about the BOATS AND THE PLANES and quotes no car, so
      // round 29 #5 gave the cars none. §3b's own table gives them a price and a loss and stops.
      // This is the third column he has now asked for, and it lands on the family the spec left out.
      //
      // ⭐⭐ THE FOUR RATES ARE A REAL-WORLD LADDER AND NOT A MULTIPLE OF THE PRICE. Servicing,
      // insurance, tyres and tax on an ordinary estate run about a twentieth of what it cost; the
      // same list on a two-seater with carbon brakes and an annual major service runs nearly twice
      // that share, and the share is what climbs, not just the money. Fuel is excluded on purpose –
      // nothing in this game knows how far anybody drove, and a cost nobody can influence should not
      // be modelled as if they could.
      //
      //   the sensible estate   5.0%   $3,000/yr    $57.69/wk
      //   the good saloon       5.5%   $6,050/yr   $116.35/wk
      //   the one from poster   7.0%  $13,300/yr   $255.77/wk
      //   the unreasonable one  9.0%  $27,000/yr   $519.23/wk   <- about one elite coach
      //
      // ⚠ THE LAST ROW IS THE POINT OF THE LADDER, AND IT IS §3f's OWN DESIGN SENTENCE READ ONE
      // FAMILY DOWN: «the toys compete with the team for the same money». A $300,000 car costs
      // roughly what the best coach in the game costs, every week, for as long as it sits there.
      //
      // ⚠⚠ NOTHING HERE CAN STRAND A FAMILY, on §3f's own test: a car has NO build wait, so it is
      // sellable from the week it is bought – there is no week in which the family is paying for a
      // thing it cannot get out from under, which is the property the yacht's ten per cent was
      // measured against.
      //
      // ⭐ AND `upkeepGrowthBps` IS THE HALF THAT IS NEW TO THE SHELF: 6% a year, compounding on the
      // car's own age and capped at double (`ECONOMY.shop.upkeepGrowthCapX`). Beside a value falling
      // 6–15% a year it is the two curves he described – a car worth less every season and dearer
      // every season – and neither of them is a second rule: they are the same two fields every rung
      // on this shelf already carries, with an age put through them.
```

## `shop.catalogue[3]`

```ts
      // ⭐⭐ ROUND 35 #5 – THE FOUR CARS NOW HAVE PAINTINGS, AND THREE OF THEM DESCRIBED A DIFFERENT
      // CAR. The owner asked for exactly this and named all four: «cars - есть арты для каждой
      // машины (универсал 60к, люкс внедорожник 110к, спорткар 190к, 4местный люкс кабриолет 300к)
      // надо и описания поправить немного с названиями».
      //
      // ⚠ SO THIS IS THE ONE FAMILY WHERE CLAUDE.md INVARIANT 4 IS SATISFIED BY THE ITEM ITSELF:
      // he asked for the names and the descriptions to be corrected, and each correction is the
      // painting he drew read back in words. Nothing else on the shelf changed a syllable.
      //
      //   60k  универсал                `The sensible estate`   – already an estate, UNTOUCHED.
      //   110k люкс внедорожник         was `The good saloon`, and a saloon is not a four-by-four.
      //   190k спорткар                 the label survives; the blurb said «twenty-five years late»
      //                                 and the painting is a new car, so that half goes.
      //   300k 4местный люкс кабриолет  the blurb said «no back seats» and the painting has four
      //                                 of them under an open roof.
```

## `shop.catalogue[6]`

```ts
      // ⭐ §3c – THE FIRST RUNG MATTERS MOST: «the earliest seasons are measured in debt, and a
      // family that finally owns where it lives is a real milestone this game currently has no way
      // to mark.» Two tiers in slice 1; the absurd end of that ladder waits.
      //
      // ⚠⚠ THE TWO PRICES ARE MINE AND NOT THE SPEC'S – §3c gives tiers, a rent idea and no numbers
      // at all, so these are MEASURED rather than declared (CLAUDE.md invariant 4). See
      // `tools/shop-probe.ts`: on the nine bench presets the first rung must be out of reach while
      // the tennis still needs the money and reachable while it does not, which is the whole of
      // acceptance §2e-5. $240,000 clears the dearest car and lands after the turn; $520,000 is the
      // rung above it, at the same distance again.
      //
      // ⚠ AND +3% IS THE SLOWEST POSITIVE RATE ON THE SHELF ON PURPOSE. §3c's word is «slow»: a home
      // that out-earned the index fund would make property the correct answer to every question and
      // §0's warning – «assets never beat a career, they only survive one» – would be broken by the
      // one family that is largest. The rent a house can pay when it is not lived in is §3c's, and
      // it is not slice 1's: an income line is movement, and this slice has none.
```

## `shop.catalogue[7].entryCents`

```ts
        // ⭐⭐ ROUND 35 #13 (03.09) – $520,000 -> $590,000, AND THE PAINTING WAS RIGHT ALL ALONG.
        // The owner: «Дом пусть будет за 590к - ок». His art for this rung has been named
        // `property-590` since round 35 #1, and round 35 #7 deliberately left the price alone
        // because he had asked to ADD two tiers and nothing else – see the note below, which was
        // this rung's own record that the stem and the price disagreed. He has now ruled, so they
        // agree: the number here IS the number in the filename.
        //
        // ⚠ NO SCHEMA MOVE, AND HE CLOSED THAT QUESTION HIMSELF: «Дом за 520к кто-то мог купить -
        // никто не купил, нет игроков». A price is read live off this row at the two sites that
        // ask – `buyAsset` (what leaves the wallet) and `shopView` (what the card quotes) – while
        // an OWNED row is valued off its own `paidCents` (`assetWorthCents`), so an existing
        // holding is arithmetically untouched by this line. Nothing is persisted, nothing is
        // renamed, `SAVE_SCHEMA_VERSION` stays at 69.
```

## `shop.catalogue[8]`

```ts
      // ⭐⭐ ROUND 35 #7 – THE LADDER GETS ITS TOP TWO RUNGS, and the ask is one clause: «Добавится
      // 2 тира домов еще: за 1.4м и за 3м». Both prices are HIS, to the digit, which is the whole
      // difference between these two rows and the two above them – §12b had to measure $240,000 and
      // $520,000 because the spec gave tiers and no numbers, and here the numbers came with the ask.
      //
      // ⚠ THE RATE IS THE FAMILY'S OWN +3% AND IS NOT A THIRD DECISION. §3c's word is «slow» and
      // both shipped houses carry 300 bps; a top rung that out-earned the ones below it would make
      // the expensive house the correct answer to a question §0 says assets must never win («assets
      // never beat a career, they only survive one»). No build wait and no upkeep, exactly as the
      // two rungs above – a house is bought and lived in, and §3f's «годовое обслуживание» is said
      // of the boats and the planes, never of these.
      //
      // ⚠ AND NOTHING BELOW THEM MOVED **AT THE TIME**. `house-garden` stayed at $520,000 through
      // this slice even though his painting for it is named `property-590`, because he had asked to
      // ADD two tiers and to change nothing else. ⭐ ROUND 35 #13 CLOSED IT the other way – «Дом
      // пусть будет за 590к - ок» – so the rung above now reads $590,000 and the stem is no longer
      // a discrepancy anybody has to carry a note about. The two prices HERE are still his own and
      // still untouched.
```

## `shop.catalogue[10]`

```ts
      // ⭐⭐ ROUND 29 #5 – THE ELITE (§3f), AND THEY ARE NOT BOUGHT, THEY ARE COMMISSIONED.
      //
      // THE OWNER: «Может что-то элитное добавить - яхты или самолеты? Со временем постройки около
      // реальным - купил и ждешь пока будет готово, яхты строят несколько лет.» And, on the shape:
      // «тоже можно разные тиры сделать, кстати и потерю стоимости в год + годовое обслуживание
      // (недельный кост, ага)».
      //
      // ⚠⚠ SO EACH ONE CARRIES THREE NUMBERS AND NOT ONE: what it cost (`entryCents`), what it loses
      // (`annualRateBps`, negative on every rung here) and what it takes every week to keep
      // (`upkeepBps`, an annual share of the PRICE – `assetUpkeepCents` divides it by the year).
      // Every figure below is §3f's own table, verbatim, including the build times.
      //
      // ⚠⚠ THE UPKEEP PERCENTAGES ARE THE REAL ONES AND THAT IS WHY THEY HURT (§3f). A yacht
      // genuinely costs about a tenth of its value a year to keep – crew, berth, fuel, survey,
      // insurance – and at $12M that is $23,076.92 a week, which is roughly thirty-eight coaches.
      // The number is not a punishment invented for balance; it is what the thing costs, and it is
      // the whole argument for owning one being a statement rather than an investment.
      //
      // ⚠ AND NOTHING HERE CAN STRAND A FAMILY, which is the house's «мы ни за что не наказываем»
      // checked against the largest bill in the game. The two states are disjoint by construction:
      // while it is BUILDING it cannot be sold and it charges NOTHING; the week it arrives the
      // upkeep starts and it becomes sellable the same week. There is no week in which the family
      // is paying for a thing it cannot get out from under.
      // ⭐⭐ ROUND 29 PART FOUR P7 – THE MERCH BRAND, the parent's FIRST business rung.
      //
      // THE OWNER (P4): «до академии можно запустить свой бренд одежды (мерча) – это может стать
      // хорошим шагом и подспорьем как в доходе, так и вообще добавить геймплея немного. А еще это
      // дешевле академии» – so it is CHEAP against the academy ($250,000 against $12,000,000, the
      // low hundreds of thousands, startable mid-career) and it EARNS: what it brings in each week
      // follows FAME – «мерч, растущий от частоты и обилия рекламных контрактов, съемок,
      // выступлений, титулов и прочего» – never rank. See ECONOMY.business.merch and
      // world/business.ts; the income lands in the till as its own 'business' line.
      //
      // ⚠ NO BUILD WAIT, NO UPKEEP AND RATE 0, the academy stages' own reading of §3g: the price
      // is the decision, the brand holds its value, and the income line – zero when nobody knows
      // her – is the whole mechanic. A negative week is unreachable by construction («мы ни за
      // что не наказываем»): fame is bounded at zero from below.
```

## `shop.catalogue[10].earningsMultipleX`

```ts
        // ⭐⭐⭐ ROUND 30 #9 – AND IT IS NOW WORTH WHAT A BUSINESS IS WORTH: years of its own income,
        // which is years of her fame. `annualRateBps: 0` above is left where it is and is now DEAD
        // for this rung – `assetWorthCents` branches on `earningsMultipleX` before it reaches the
        // rate – and it is kept rather than deleted because the type requires it and because zero is
        // the honest answer to «what rate does it drift at»: none, it is priced off earnings.
        //
        // ⚠⚠ THE RESEARCH GAVE A BAND AND NOT A NUMBER, AND SAYS SO
        // (docs/research/player-brands-and-what-they-are-worth.md §5.4): NO player-brand transaction
        // publishes both an earnings figure and a price. The two nearest are Beckham's DRJB – 55%
        // sold for ~$269M, implying ~$489M against FY2024 profit of $44.9M, so ~10.9x – and the
        // Nadal academy at ~€209M against €6.8M net profit, ~31x. HIS OWN REFERENCE, the RF mark,
        // has no published valuation at all: it sits in a private Swiss holding company (Tenro AG)
        // and On Holding's filings name it only in a risk factor, never in the financials. So this
        // figure is a CHOICE inside a wide, thin band and the measurement is what chose it.
        //
        // ⭐⭐⭐ ROUND 30 #23 – AND SINCE 30.08 IT IS THE *BASE* MULTIPLE AND NOT THE WHOLE ONE. The
        // career earns more on top of it: `world/brand.ts` adds seasons played, seasons ended
        // top-20, professional finals reached and her win rate, capped at
        // `ECONOMY.business.merch.value.maxX`. Everything the two paragraphs below say about SIZING
        // still holds – it is the same criterion measured against the same week – but the number a
        // given career is priced at is now a range and not this constant.
        //
        // ⚠⚠ WHY THE BASE LIVES HERE AND THE LADDER LIVES IN `ECONOMY.business.merch.value`: this
        // field is the PREDICATE («this rung is priced on its earnings» – `assetWorthCents` branches
        // on its presence and `tests/round30-brand-value.test.ts` holds the catalogue to exactly one
        // rung carrying it), so the number that says where that pricing STARTS belongs on the row the
        // shop actually sells. A copy in the constants block would be a second home for one fact.
        //
        // ⭐⭐ THE CRITERION IS «FAIR ON THE DAY THEY CAN AFFORD IT».
        // `tools/merch-fame-vs-rank.ts` walks 108 careers x 780 weeks and reads the fame a family
        // holds the first week its wallet can carry twice the $250,000 price. The brand has to be
        // worth about what it cost at the fame AND the career those families actually hold, so the
        // purchase is not a paper loss the week it is made – which is what a punishing multiple would
        // have made it, on the one rung whose whole pitch is «дешевле академии». Above that the
        // family gains; below it the family is down; and both directions are the item. ⚠ The
        // measurement that picked this base against the earned ladder is
        // docs/specs/brand-worth-and-income-2026-08.md.
        //
        // ⚠ AND IT FALLS DURING HER CAREER, which is the only fall the game is in frame for: fame
        // halves over 104 weeks and the income is CONVEX in it, so a year with no title costs the
        // brand more than a proportional share of its value. The floor under it is
        // `ECONOMY.shop.businessValueFloorShare`.
```

## `shop.catalogue[11]`

```ts
      // ⭐⭐⭐ ROUND 35 #8 – THE TWO BOTTOM RUNGS SWAPPED IDENTITIES, AND ONLY THEIR IDENTITIES.
      //
      // THE OWNER: «water - карточки как на домах, все арты яхт в наличии, меням местами только: за
      // 900к это парусник, за 2.4м уже небольшая яхта, дальше как было.» His two paintings say the
      // same thing without a word: `water-900` is a sloop under full sail, `water-2400` is a small
      // motor yacht on the plane.
      //
      // ⚠⚠ THE IDS DID **NOT** MOVE WITH THE IDENTITY THIS TIME, AND THAT IS A DELIBERATE DEPARTURE
      // FROM THE PRECEDENT DIRECTLY BELOW (part three P1 renamed `boat-motor` to `boat-sail` and
      // paid for it with migration v66). The reason is that this is a SWAP rather than a rename:
      // moving both ids would collide mid-flight, so it needs two renames, a schema bump and a
      // golden fixture to express what the player sees as two cards trading places. The ids are
      // internal – nothing on screen reads them but `src/art/shelf.ts`, which is keyed by id and
      // was written for exactly this – so the cost buys nothing a player can see. ⭐ `boat-launch`
      // is the SAILING BOAT now and `boat-sail` is the SMALL YACHT; the names are stale and the
      // rows are right, and one sentence from him turns that into a v70 migration.
      //
      // ⚠ PRICE, BUILD TIME, RATE AND UPKEEP ARE UNTOUCHED ON BOTH ROWS – «дальше как было», and
      // his swap is about what the thing IS at each price, never about what it costs.
```

## `shop.catalogue[12]`

```ts
      // ⭐ ROUND 29 PART THREE P1 – THE MOTOR BOAT BECAME A SAILING YACHT, his ask verbatim:
      // «моторка $2.4М – давай переделаем на парусную яхту пожалуйста». He changed what it IS,
      // never what it costs: price, build weeks, annual loss and upkeep are the motor boat's own,
      // untouched. The id moved with the identity – the art hook is the id everywhere on this
      // shelf – and v66's migration renames owned rows in the same wave, so no save is stranded
      // on a rung the catalogue no longer carries.
      // ⚠ ROUND 35 #8 READ THIS PARAGRAPH AND DID NOT DELETE A WORD OF IT: it records a real ruling
      // he made in round 29, and the ruling stands – the 2.4M rung is still not a motor boat named
      // by a spec, it is whatever he last said it is. What moved on 03.09 is which rung is the
      // SAILING one, and the id is now stale rather than wrong. See the note on `boat-launch` above.
```

## `shop.catalogue[13]`

```ts
      // ⭐⭐ THE TWO THAT GRANT THE WEEK (§3f, and it is the owner's own idea): «а неделя на яхте
      // (при наличии яхты) вполне может стать новой строкой отпуска, кстати».
      //
      // ⚠ ONLY THESE TWO, AND THAT IS STILL THE NARROW READING OF «при наличии ЯХТЫ» ON PURPOSE –
      // re-argued at part three P1, because the sailing yacht above made the old sentence («the
      // spec calls neither of them a yacht») stop covering the shelf. The WEEK is a crewed week:
      // its own copy is a crew of six and nobody able to reach her, and the crew is what these two
      // rungs' 10% upkeep is buying – the «real ones» note above names it first. The launch and
      // the sailing yacht keep the boats' 6%: hull, berth and survey, nobody on the payroll. A
      // family that sails itself has a boat, not a holiday staff, so the sailing yacht grants
      // nothing – the grant reads what the upkeep pays for, never the word in the label. §11's own
      // acceptance – «a career orders a yacht, WAITS THREE YEARS» – is still this rung's build
      // time and not theirs.
      //
      // ⚠ ROUND 35 #8 MOVED THE WORD «SAILING» ONE RUNG DOWN AND NOT ONE PENNY OF THIS. The two
      // rungs the paragraph above calls «the launch and the sailing yacht» are the 900k and 2.4M
      // rows, which is what they still are; only their labels traded places. The rule it states is
      // the reason nothing had to move: the grant reads the 10% upkeep, never the label, so a rung
      // that is CALLED a yacht at 2.4M still grants no week because it still keeps no crew.
```

## `shop.catalogue[15]`

```ts
      // ⭐⭐ THE PLANE IS THE PARENTS', AND THE OWNER CORRECTED ME ON EXACTLY THAT (§3f): «Самолёт не
      // её, а родителей =) Теоретически может вполне резать косты на перелеты до соревнований,
      // почему бы и нет. По усталости по аналогии с кортом может 1 накинуть, не вижу причин не
      // делать, не такая большая величина».
      //
      // ⚠ BOTH EFFECTS RIDE ON THE FAMILY, not on the rung: a long-range plane costs more, loses
      // more and keeps for more, and it flies the same people to the same tournaments. The spec
      // gives the two aircraft three different numbers and one identical purpose, so inventing a
      // second, better cut for the dearer one would be a rule this file does not have.
      // ⭐⭐ ROUND 35 #9 – A SECOND LIVE AEROPLANE, UNDER THE ONE THERE IS. The owner: «air -
      // карточки как на домах, добавляется небольшой самолет 8 мест за 7м, большой на 12 мест
      // остается как был за 18м», and, when asked, in as many words: «у нас сейчас один активный за
      // 18м, раньше был еще за 28м, а я прошу добавить второй за 7м с картинкой».
      //
      // ⚠ THE PRICE IS HIS AND THE OTHER THREE NUMBERS ARE THE FAMILY'S OWN. Both shipped aircraft
      // carry the same rate (−600) and the same upkeep (800 bps), so those two are not a choice at
      // all – they are what a plane costs on this shelf. The BUILD TIME is the one figure the two
      // rungs do not share (104 at $18M, 156 at the retired $38M, rising with the price), so the
      // rung below them gets the shortest wait on the shelf, 52 weeks – the same year `boat-launch`
      // waits, and about what a light aircraft really takes. ⭐ It is MINE and not his: one number,
      // and moving it moves nothing else.
      //
      // ⚠⚠ ITS BLURB DELIBERATELY DID NOT COUNT THE SEATS, AND ROUND 35 #13 IS THE WORD THAT
      // CLOSED IT. The row shipped silent on the cabin because his first message called this one
      // «8 мест» and the $18M one «большой на 12 мест» while the $18M row had said «Eight seats»
      // since round 29 #5 – two cards on one screen would have claimed the same cabin, and
      // CLAUDE.md invariant 4 forbids an agent editing a shipped sentence it was not asked to edit.
      // The note said one word from him closes it. On 03.09 he gave two: «самолет 18м стоит
      // (верно) мест пусть будет 10. У маленького 7. всё.»
      //
      // ⭐ SO BOTH COUNTS ARE HIS, THE PRICES ARE UNTOUCHED, and the pair is consistent for the
      // first time: seven below, ten above. ⚠ THIS IS THE ONE KIND OF WORDING CHANGE INVARIANT 4
      // ALLOWS – he asked for these numbers by name, so the sentence moves because he moved it and
      // not because an agent thought it read better. Nothing else on either row changed a syllable.
      //
      // ⭐ AND SEVEN IS A REAL AEROPLANE. His own research (docs/research/private-jets-in-tennis.md)
      // prices Nadal's Cessna Citation CJ2+ at $5–7M for up to 8 passengers, so the $7M rung sits on
      // an aircraft that exists at that money – the price was chosen before the research and
      // survived it.
```

## `shop.catalogue[18]`

```ts
      // ⭐⭐ ROUND 29 #5 – HER ACADEMY (§3g), THE END OF THE MONEY.
      //
      // THE OWNER: «построить свою академию за много миллионов - тоже может быть интересно, кстати.
      // Как раз будет куда рекламное тратить.»
      //
      // ⚠⚠ FOUR STAGES IN THE SPEC'S OWN ORDER – «land, courts, the building, the staff» – AND THE
      // ORDER IS ENFORCED, not suggested: `requiresId` chains them, so a half-built academy is a
      // real state the player can sit in (§3g's own words) and courts cannot appear on land nobody
      // owns. That is why THIS family is the one exception to the catalogue's «cheapest first»: the
      // stages read in BUILD order, and the last one is not the dearest.
      //
      // ⚠⚠ THE FOUR PRICES ARE MINE AND NOT THE SPEC'S, exactly as the two house tiers were (§12b).
      // §3g gives a band – «Cost: $8–15M, in STAGES rather than one press» – and four stage names,
      // and stops. $2M + $3M + $4M + $3M = $12,000,000, the middle of his band, and each stage is a
      // real decision on its own rather than a step nobody notices.
      //
      // ⚠ NO BUILD WAIT AND NO UPKEEP, because §3g asks for neither and this file does not invent
      // what it was not given. §3f's «время постройки» and «годовое обслуживание» are said of the
      // boats and the planes; the academy's own sentence is «each stage is a decision and a bill»,
      // and a stage IS the wait.
      //
      // ⭐⭐⭐ ROUND 41 #24 (12.09) – THE OWNER GAVE THE FILE WHAT §3g HAD NOT, AND THE PARAGRAPH
      // ABOVE IS AMENDED RATHER THAN DELETED: it recorded, correctly, that the wait was never ours
      // to invent. He asked for it himself – «может быть для Академии корты, клубный дом и стафф
      // тоже должны сколько-то строиться по времени, а не сразу быть готовы?» – and then ruled the
      // proposed timings and the round in one line: «сроки ок, в этот же раунд заводи пожалуйста».
      // So three of the four stages now carry §3f's own `buildWeeks`, and the UPKEEP half of the
      // sentence still stands untouched: he asked about building time, not about a maintenance
      // line, and the spec's §2 refusal of a land/building split is the reason inventing one here
      // would be worse than silence.
      //
      // ⚠⚠ THE LAND DOES NOT BUILD, AND THAT IS HIS OWN LIST READ LITERALLY: «корты, клубный дом и
      // стафф» names three things and the deeds are not among them. A field is BOUGHT rather than
      // BUILT – there is nothing to wait for once the money has moved – so `academy-land` carries no
      // `buildWeeks` and a career that orders it owns it the same week, exactly as it always has.
      //
      // ⚠⚠ THE THREE NUMBERS ARE THE ROUND'S PROPOSAL, WHICH IS WHAT HE APPROVED: courts 6 weeks,
      // the clubhouse 12, the staff 3. His band for the hire was «2–4» and the round proposed ONE
      // number out of it – 3, the middle – because a range is not a field. The two builds are the
      // shortest waits on this shelf by a long way (`boat-launch`'s 52 is the next one up), and that
      // is the point rather than an oversight: sixteen courts and a clubhouse are a season's work in
      // a way a yacht is not, and the whole of §3g's «a half-built academy is a real state the
      // player can sit in» is that the stages are LIVED through rather than waited out.
      //
      // ⚠⚠⚠ AND NOT ONE LINE OF MACHINERY MOVED FOR THIS. Every reader of academy ownership already
      // asks `deliveredAssets` – the income (`assetWeeklyIncomeCents`'s own first line), the ending's
      // stage count, the sale, the upkeep meter – and the WORTH falls out of the clamps two
      // functions already carry (`buyAsset` writes `basisWeek = readyWeek`, and both
      // `assetValueCents` and `rampedWorthCents` clamp a negative span to zero), so a stage under
      // construction is worth exactly what was paid for it, which is the boats' own behaviour to the
      // cent. A wait that needed a new guard would have needed a new persisted field; this one needs
      // neither, and `SAVE_SCHEMA_VERSION` does not move.
      //
      // ⭐⭐⭐ ROUND 38 #8 (07.09) – THE FOUR RATES MOVED 0 -> +300 bps, WHICH IS THE HOUSES' OWN
      // NUMBER, AND THE OWNER ASKED FOR EXACTLY THAT COMPARISON: «а что насчёт стоимости и индексации
      // этой стоимости с годами? Как с домами, например.»
      //
      // ⚠⚠ WHAT HE WAS LOOKING AT WHEN HE SAID IT, 06.09: «Академия при этом стоит ровно на месте –
      // и это не очень корректно, как мне кажется.» And he was reading the catalogue correctly.
      // `assetValueCents` indexes EVERY rung by `annualRateBps`; the academy was the only family on
      // the shelf carrying a literal zero, so «стоит ровно на месте» was not a rounding artefact or a
      // missing formula – it was this field, four times. The fix is this field, four times.
      //
      // ⚠⚠ ONE RATE AND NOT TWO, AND THE SPLIT IS REFUSED ON PURPOSE (the spec's §2). A real
      // academy's LAND appreciates while its BUILDINGS depreciate and have to be maintained – true,
      // and deliberately not modelled, because this family carries no `upkeepBps` at all. Splitting
      // the drift would ship the LOSS without the upkeep line that justifies it, and the four stages
      // would quietly diverge on a screen that offers no reason why. The honest version of that split
      // is a later item WITH a maintenance line beside it, and it is his call, not this one's.
      //
      // ⚠ THE SENTENCE ON THE CARD MOVES WITH THE NUMBER, AND NO STRING WAS EDITED TO MOVE IT.
      // `rateLine` picks its branch off `annualRatePct`, so these four rows now read the HOUSES'
      // sentence («Gains about 3% a season») instead of the zero branch's «Neither gains nor loses» –
      // which is precisely «как с домами» arriving on screen. Invariant 4 is satisfied the strict
      // way rather than the convenient one: the copy in `MoneyScreen.vue` is untouched to the byte,
      // and what changed is the data the existing sentence is chosen by. ⚠ The zero branch is now
      // reachable from no rung on the shelf; it is KEPT, because it is the honest answer for the next
      // rate-0 rung and deleting a correct branch to chase coverage is how a shelf loses a case.
      //
      // ⚠ THIS NOTE USED TO END «and the shelf says so in as many words («Holds its value»)» AND THAT
      // SENTENCE IS GONE FROM THE SHELF – round 30 #11, the owner: «Holds its value странно звучит –
      // это напрямую значит, что оно обесценивается, а это вроде бы не совсем так». The MECHANIC did
      // not move a cent then (checked first: a rate-0 rung is worth what was paid for it forever and
      // the sale is whole), only the words. This time it is the other way round: the mechanic moved
      // and the words followed it. A comment naming a string that no longer exists is the one way a
      // comment must not be wrong, so it names the new one: **«Gains about 3% a season»**, the same
      // sentence all four houses read.
```

## `shop.planeTravelShare`

```ts
    /** ⭐⭐ ROUND 29 #5, §3f – WHAT THE FAMILY'S OWN PLANE TAKES OFF A FARE, as a share of it.
     *
     *  THE OWNER: «Теоретически может вполне резать косты на перелеты до соревнований, почему бы и
     *  нет.» ⚠ THE VERB IS «резать» AND NOT «убрать», and this number is that distinction made
     *  mechanical: the plane HALVES the family's travel bill, it does not delete it. Three reasons
     *  the share is a half rather than the whole fare, and the spec gives no figure at all:
     *
     *    1. a fare that fell to zero would take the travel LINE off the family's ledger, and a cost
     *       the player cannot find is this repo's own named defect (the academy's $20,879);
     *    2. flying your own aeroplane is not free – it is what `upkeepBps` above is charging for,
     *       and a plane that both zeroed the fare and billed the upkeep would be describing one
     *       journey twice;
     *    3. it is not a balance lever in either direction. A season of travel is four figures and
     *       this aircraft costs $27,692 A WEEK to keep, so the cut can never be the reason to buy
     *       one. §3f is explicit that owning these is «a statement rather than an investment».
     *
     *  ⚠ IT COMES OFF EVERY SEAT THE FAMILY PAYS FOR – hers, the coach's and the masseur's – because
     *  it is ONE AIRCRAFT carrying all of them. That does not touch the 15.08 ruling that support
     *  may not pay for the entourage: a scholarship is somebody else's money and this is the
     *  family's own. */
```

## `shop.planeTravelRestBonus`

```ts
    /** ⭐⭐ §3f – WHAT THE PLANE ADDS TO A WEEK SHE SPENDS TRAVELLING, in condition points.
     *
     *  THE OWNER: «По усталости по аналогии с кортом может 1 накинуть, не вижу причин не делать, не
     *  такая большая величина.»
     *
     *  ⚠⚠ IT IS HIDDEN, AND THAT IS HIS OWN RULING ON THE COURT IT IS AN ANALOGY OF: «верно, но
     *  только если знают об этом, я предложил сделать бонус скрытым». §3d rule 4 spells out what
     *  hidden means – «never a number on a card» – so no shelf row, no confirm dialog and no note
     *  anywhere states it. The effect is visible where every effect in this game is visible: in the
     *  condition line, over weeks.
     *
     *  ⚠ AND IT CANNOT STACK WITH THE COURT (§3d), by construction rather than by a cap: the court's
     *  +1 lands on weeks she is NOT competing and this one lands on weeks she IS. §3f: «No week can
     *  receive both, so a family owning everything gets a corridor that is one point kinder across
     *  the board – never two.» */
```

## `shop.upkeepGrowthCapX`

```ts
    /** ⭐⭐⭐ ROUND 30 #15 – THE CEILING ON A RISING UPKEEP, as a multiple of its first-year figure.
     *
     *  THE OWNER: «годовая стоимость обслуживания, которая может с каждым годом НЕМНОГО расти».
     *
     *  ⚠⚠ «НЕМНОГО» IS WHAT THIS NUMBER IS FOR. `upkeepGrowthBps` is 6% a year, which is a small
     *  step and a large product: unbounded, a car kept fifteen seasons would cost 2.4x its first
     *  year, and one kept longer would keep going. A bill that compounds without a stop is the
     *  shape «мы ни за что не наказываем» rules out – it turns a purchase the family made once
     *  into a debt that grows for as long as they keep it.
     *
     *  ⭐ AND IT IS THE SENTENCE A PLAYER CAN HOLD: **the bill can at most double.** 6% a year
     *  reaches it in the twelfth season of ownership, which is longer than any car in a fifteen-
     *  season career is realistically held, so the cap is the guarantee rather than the common case
     *  – it binds the tail and leaves the curve he asked for alone.
     *
     *  ⚠ IT BINDS THE MULTIPLIER AND NOT THE YEARS, deliberately: a cap in years would have to be
     *  re-derived every time the growth rate moved, and the promise would silently change with it. */
```

## `shop.businessValueFloorShare`

```ts
    /** ⭐⭐⭐ ROUND 30 #9 – THE FLOOR UNDER A BUSINESS RUNG'S VALUE, as a share of what was paid.
     *
     *  ⚠⚠ IT IS THE MARK, AND IT IS A SOURCED IDEA RATHER THAN A KINDNESS. Björn Borg's own company
     *  went bankrupt in 1990; the NAME was licensed from 1997, bought outright for $18 million at the
     *  end of 2006 and is a Nasdaq Stockholm company doing SEK 1,044M today
     *  (docs/research/player-brands-and-what-they-are-worth.md §4d). A brand with no earnings left is
     *  not a brand with no value – somebody will buy the name.
     *
     *  ⭐ A QUARTER, so a family between reigns is meaningfully down and never wiped out: «мы ни за
     *  что не наказываем» read against a rung they CHOSE to buy, on a shelf whose own §3b law is
     *  «THIS FAMILY EXISTS TO LOSE MONEY AND THAT IS THE POINT». It is also the one thing that keeps
     *  a sale possible in the years she is quiet, which is what makes the decision to sell a real
     *  fork rather than a trap. */
```

## `shop.worthRamp`

```ts
    /** ⭐⭐⭐ ROUND 38 #16 (07.09) – A BRAND IS A PROCESS, NOT A PURCHASE.
     *
     *  THE OWNER, overturning the `max(catalogue, worth)` rule he had approved the day before:
     *  «если мы до пика известности бренд не покупали, то он всё равно поднимался в цене? Это
     *  супер-странно. Я бы сказал, что он неизменно для первого открытия стоит 250к, а потом МОЖЕТ
     *  набрать свои 5млн, но не за 1 день, т.к. это процесс. Если уровень известности большой, то
     *  набор будет идти быстрее (может быть кратно быстрее), но он всё равно будет идти, на это надо
     *  время.» And on the number: «полураспад 2 года при средней славе, кратно быстрее при высокой».
     *
     *  ⚠⚠ WHAT IT REPLACES AND WHY HIS SHAPE IS BETTER. A rung whose worth is DERIVED used to be
     *  worth its full derived value the instant it was bought, so it could be sold at that value and
     *  bought back at the catalogue price – +$2,326,989 a cycle on his own save, repeatable, in one
     *  week. `max(catalogue, worth)` closed that by making the PURCHASE dear, which also made a FIRST
     *  brand on a famous career cost $5,172,791 – the strange half he objected to, and it needed a
     *  price on the card that was not the price on the card. A worth that RAMPS from what was paid
     *  toward the derived value closes the same loop by construction: a freshly bought brand is worth
     *  what was paid for it, so selling at $5.17M and buying back at $250,000 LOSES $4.9M.
     *
     *  ⭐ AND IT ANSWERS THE FIRST THING HE ASKED THIS ROUND FROM THE OTHER SIDE. A stored value that
     *  CHASES its derived value smooths the FALL as well as the climb – «делая его более плавным»,
     *  item 2. One mechanism, both directions.
     *
     *  ⚠ NO SCHEMA MOVE: the ramp is a function of `boughtWeek` and `paidCents`, both persisted since
     *  the shelf shipped. An existing save's brand simply starts converging from where it is. */
```

## `shop.worthRamp.minHalfLifeWeeks`

```ts
      /** ...and the other end: a driver this far above the median stops buying more speed.
       *
       *  ⭐⭐ ROUND 39 #5 (REOPENED, owner 08.09 «давай попробуем») – 13 → 52, AND THE OLD FLOOR IS
       *  WHY THE LOOP SURVIVED ROUND 38. At the fame cap the pace ratio is 100/12.8 ≈ 7.8, so the
       *  half-life ran all the way down to ~13.3 weeks and a $250,000 brand was worth $1,844,174
       *  ONE WEEK after purchase (his own report: «свежекупленный бренд возвращался к своей
       *  стоимости уже в течение 5 недель» – measured, the 5-week point was $8.2M of $35.9M).
       *  His round-38 law stands unmoved – «полураспад 2 года при средней славе, кратно быстрее
       *  при высокой» – because 104/52 = 2x faster at the cap is still «кратно»; what the old
       *  floor allowed was 8x, which is «за несколько недель», the exact complaint. At 52 the
       *  week-1 worth of a fresh cap-fame brand is ~$723k and half the derived value takes a full
       *  year: «это процесс» at every level of fame. Measured in tools/r39-brand-loop.ts. */
```
