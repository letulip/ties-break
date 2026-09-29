---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The fame block

The comment essays that stood above the `fame` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `fame`

```ts
  // --- FAME (round 29 part four P7/P8, docs/specs/fame-and-the-shoots-2026-08.md) ---------------
  //
  // «нам важны разные спонсоры и их появление как можно раньше в плане фотосессий и их количества –
  // это прямой рычаг известности» – and his «здесь полностью согласен» on the floor-and-multiplier
  // shape: THE FLOOR IS EARNED ON COURT AND THE SHOOTS MULTIPLY IT. A champion who never shoots is
  // still famous; a face with no results has nothing for the photographs to multiply.
  //
  // ⚠⚠ FAME IS A FOLD, NEVER A ROLL. It is a pure function of what has already happened – dated
  // titles (`trophiesByTier`, weeks, never pruned), lost Slam finals (same ledger), seasons ended
  // inside the top 10 (`seasonHistory[].byTrack.wta.endRank`) and shoot weeks already lived
  // (`AdOfferTerms.shootWeeks` on signed letters) – so RNG input-independence is not merely
  // respected but unreachable: there is no die anywhere in it, and nothing is persisted for it
  // (the stock is re-derived from the career's own records on every read). See world/fame.ts.
```

## `fame.slamDebutFloor`

```ts
    /** ⭐⭐⭐ ROUND 41 #18 PART TWO (12.09) – WHAT HER FIRST GRAND SLAM MAIN DRAW IS WORTH, once, dated
     *  at the week she played it and decaying on the TITLE clock like every other result.
     *
     *  THE OWNER, 12.09: «да, делаем fame за основу Шлема, надо полностью с математикой бренда
     *  разобраться, чтобы этот вопрос уже не поднимался… У нее был вайлдкард на Шлем, когда она была
     *  #155.»
     *
     *  ⚠⚠ THE DEFECT IT ENDS. Before this line a Slam main draw was worth EXACTLY ZERO fame unless
     *  she reached the final: `titleFloor.slam` pays the champion, `slamFinalFloor` pays the runner-up,
     *  and the other 126 women in the draw – including a #155 wildcard playing the biggest tournament
     *  of her life in front of the largest audience in the sport – left no trace in the stock at all.
     *  On the reference career the Slam DEBUT at ~w130 moved nothing; her brand woke 36 weeks later
     *  on a World Tour 500 title, which is the plateau he reported as item 18.
     *
     *  ⚠⚠ THE DEBUT AND NOT THE APPEARANCE, which is the whole sizing argument. A regular's Slam
     *  weeks are already paid for – she wins rounds, she reaches finals, she ends seasons in a band,
     *  and every one of those is a term above. Paying per appearance would price the same career
     *  twice and would grow without bound for a top-20 player who plays four a year for a decade.
     *  What NOTHING above can see is the first one: the week the world learns the name. That is a
     *  singular event, so it is a singular step.
     *
     *  ⚠ 4, AND THE LADDER IS WHY. Against `titleFloor` – slam title 25, wta1000 14, wta500 8,
     *  wta250 4 – a Slam main draw is worth one World Tour 250 title. That is deliberately modest:
     *  she has won nothing, and the claim is only that the world has now seen her. It is also ~16% of
     *  the Slam title's own step, which keeps «выиграть Шлем» an order of magnitude above «сыграть
     *  Шлем». docs/specs/the-fame-and-the-brand-2026-09.md §2 carries predicted against measured.
     *
     *  ⚠ IT NEEDS A DATED ROW AND IT HAS ONE WITHOUT A SCHEMA MOVE: the `keep: true` milestone
     *  `SLAM_DEBUT_KEY` fired in `finalizeTournament`, which `pruneEvents` can never drop. Careers
     *  that reached a Slam BEFORE this shipped carry no row and get no retroactive credit – stated in
     *  the spec's §6 rather than papered over. */
```

## `fame.finalFloorShare`

```ts
    /** ⭐⭐⭐ ROUND 34 #17 (03.09) – WHAT A LOST FINAL AT EVERY OTHER PROFESSIONAL TIER IS WORTH, as a
     *  SHARE of that tier's own title step. Approved by the owner at 0.4.
     *
     *  ⚠⚠ THE DEFECT IT ENDS: `trophiesByTier[tier].finals` has recorded a dated, per-tier, never
     *  pruned runner-up plate since schema v31 and NOTHING IN THE GAME EVER READ IT except at
     *  'slam'. On the owner's own week-569 save that is SIXTEEN finals worth exactly zero to her
     *  fame – 5 local, 2 regional, 1 national, 1 w15, 4 w50, 2 w100, 1 wta125 – for a girl who has
     *  spent a decade in and around the world top 100 and whose complaint («доход опустился с 200 до
     *  65 долларов в неделю с бизнеса… Она доходит в Шлеме до QF и вообще стабильно в 100 держится»)
     *  is precisely that the model cannot see the career she is having.
     *
     *  ⚠ A SHARE AND NOT A LADDER, so it cannot drift away from `titleFloor`. One number, and the
     *  per-tier shape is the title ladder's own – a w15 runner-up plate is worth 0.1 and a WTA 1000
     *  one 5.6, in the same proportion the titles are.
     *
     *  ⚠⚠ AND IT DOES NOT REACH 'slam', WHICH IS THE ONE PLACE IT WOULD DOUBLE-COUNT.
     *  `slamFinalFloor` above already pays that plate and pays it more (12 against 0.4 x 25 = 10),
     *  so `fameFloorOf` excludes the tier by name rather than by arithmetic.
     *
     *  ⚠ IT IS FAME AND NOT THE VALUATION MULTIPLE. `business.merch.value.finalX` prices the SAME
     *  finals into the multiple, deliberately and since round 30 #24 – see that constant for why
     *  both survive and what the multiple measured after this shipped. */
```

## `fame.seasonEndBands`

```ts
    /** ⭐⭐ WHAT A FINISHED SEASON'S END-RANK IS WORTH, best matching band only, counted once per
     *  season from its wrap week. The spec's floor list says «a first top-10 season»; this is that
     *  entry as a LADDER, in the shape `academy.reputationBands` already uses two blocks up.
     *
     *  ⭐⭐⭐ ROUND 30 #24 – SHIPPED 30.08, AND THE TWO LOWER RUNGS ARE THE ITEM. The owner, three
     *  times: «она же топ-20 в мире». Before them a career built on quarter- and semi-finals earned
     *  no title, reached no Slam final and ended no season in the top ten, so its fame floor was
     *  EXACTLY ZERO and its brand was worth nothing however high it ranked – a top-20 player was
     *  invisible to her own brand by construction. That is arithmetic, not a measurement, and it is
     *  what the two rungs end.
     *
     *  ⚠ THE DATA FOR «DEEP RUNS» ITSELF DOES NOT EXIST AT THE TOURNAMENT LEVEL: `TierTrophies`
     *  records `titles` and `finals` and nothing below a final, so a quarter-final leaves no durable
     *  trace anywhere in the save. The END-RANK ladder is the answer that needs no schema move,
     *  because `seasonHistory[].byTrack.wta.endRank` is already written for every finished season –
     *  and a season ended at #18 IS the deep runs, summed and sorted by the tour itself.
     *
     *  ⚠⚠ IT MOVES MERCH INCOME AND THE BRAND'S WORTH ON EVERY CAREER, and it was benched before it
     *  was kept: 72 careers x 780 weeks, median peak fame 58.9 -> 67.5 (+14.6%), with the two rows
     *  that make it safe UNCHANGED – the fame the week a family can first afford the brand (9.6) and
     *  the brand's worth on the day they buy it. A family reaches first affordability before it has
     *  finished top-50 seasons to bank, so round 30 #9's «fair on the day they can afford it»
     *  multiple and the fund-parity anchor both survive untouched. The lift lands in the MIDDLE of
     *  the distribution, which is where he asked for it: p90 and best are already at the fame cap.
     *  ⭐ It also partly answers round 30 #13 as a side effect – a top-20 season feeds the stock
     *  WHILE SHE IS CLIMBING, so climbing windows that lose income fall 15.1% -> 13.7%.
     *  Predicted vs measured: docs/specs/brand-worth-and-income-2026-08.md. */
```

## `fame.seasonEndBands[3]`

```ts
      /** ⭐⭐⭐ ROUND 38 #2c (06.09) – THE RUNG THE LADDER STOPPED ONE SHORT OF, and the owner's own
       *  words are the argument: «спортсменка проводит свой лучший сезон (и не один) находясь в
       *  ТОП-100 … у нее явно есть и репутация и о ней знают».
       *
       *  ⚠⚠ WHAT IT ENDS, on his week-1115 career: NINE seasons ended inside the top 100 were worth
       *  exactly ZERO fame, because the ladder stopped at 50. A decade of being a professional the
       *  world can name bought nothing at all, while one WTA 500 title on one Sunday bought 8.
       *
       *  ⚠ 0.6 IS THE LADDER'S OWN RATIO CONTINUED AND NOT A NEW LEVEL. The rungs above step by
       *  10 / 4 / 1.5 – ratios of 2.50 and 2.67 – and 1.5 / 2.6 is 0.58. Rounded to 0.6, so the
       *  shape of the ladder decides the number rather than a preference about how much a top-100
       *  season "should" be worth. */
```

## `fame.seasonHalfLifeWeeks`

```ts
    /** ⭐⭐⭐ ROUND 38 #2c (06.09) – THE CAREER CLOCK: how long a FINISHED SEASON inside a band the
     *  world notices is remembered, against `halfLifeWeeks` above for a single title.
     *
     *  THE OWNER: «у нее явно есть и репутация и о ней знают, не могу забыть за год.»
     *
     *  ⚠⚠ IT SHIPPED AT 104 FIRST – identical to the title clock, deliberately, so the split could be
     *  proved a no-op before it was tuned. The value below is the tuned one; `seasonFloorDecayAt`'s
     *  header carries what it ends and `docs/specs/fame-presence-2026-09.md` carries predicted
     *  against measured over 29 of his own careers.
     *
     *  ⚠ IT MUST BE THE LONGEST OF THE THREE CLOCKS (title 104, campaign 52-156 by band, this one),
     *  or a season is forgotten faster than the title won inside it.
     *
     *  ⚠⚠ 312 = SIX YEARS, AND IT IS MEASURED. His best season ever – #20, wrapped at week 884 – was
     *  worth 0.86 fame points at week 1115 on the title clock and is worth 2.39 on this one. The
     *  sweep is `tools/r38-fame-presence-sweep.ts` over 29 of his own careers; 104 / 208 / 312 / 416
     *  are all in it and the table is in docs/specs/fame-presence-2026-09.md. */
```

## `fame.shootFloorByBand`

```ts
    /** ⭐⭐⭐ ROUND 32 #5 (31.08) – WHAT A DELIVERED SHOOT ADDS TO THE FLOOR, per band of the deal
     *  that asked for it. `docs/specs/collaborations-as-early-fame-2026-08.md`, and it is the item.
     *
     *  THE OWNER: «карьера топ-20 без титулов … Мне кажется здесь как раз на раннем этапе
     *  коллаборации нам должны помочь, они станут хорошим рычагом роста известности и стоимости
     *  бренда как раз» – and «и это надо внедрять да».
     *
     *  ⚠⚠ AN ADDITION AND NOT A COEFFICIENT, WHICH IS THE WHOLE ITEM. `shootStep` above MULTIPLIES
     *  the floor, and a multiplier cannot lift a career that has nothing to multiply: fame in this
     *  game is a TITLE currency (`titleFloor` pays 8 for one World Tour 500 against 4 for a whole
     *  season ended in the top 20), so the early career the owner is asking about has a floor of
     *  almost nothing and five live deals buy a multiple of almost nothing. A signed campaign is a
     *  public event in its own right – a face on a shelf reaches people who have never watched a
     *  match – so it belongs on the same ledger as a title, not on the coefficient applied to titles
     *  she has not won.
     *
     *  ⭐ BOTH SURVIVE, ON HIS RULING («давай, да»): the ADD is the early rung and `shootStep`'s
     *  multiplier is the late one, so a champion who also sells feels both.
     *
     *  ⚠⚠ BY THE DEAL'S BAND, ON HIS RULING – «по полосе сделки (глобальный дом это не локальный
     *  ретейнер) – да». The index is `advertising.bands`' own, weakest-first like every ladder in
     *  this file, and the band a letter was written at is recovered from the cheque it states
     *  (`adBandOfTerms`) rather than stored – so no letter needs a new field and every paper already
     *  in a save answers the question it was always carrying.
     *
     *  ⭐⭐ AND THE GRADIENT IS GENTLE ON PURPOSE – 2.75x from the local retainer to the global house,
     *  against the SIXTY-FOLD span of the cheques those two bands write ($20,000 to $1.2M in
     *  `categories.watches`). What a shoot buys here is REACH, and reach does not scale with the
     *  cheque: a bigger house means better placements in more countries, not a hundred times the
     *  faces. ⚠⚠ A STEEP GRADIENT ALSO DESTROYS THE THING THE ITEM IS FOR, which is a measurement
     *  rather than an aesthetic – the high bands are where the shoot ASK is highest (2 weeks a year
     *  a deal against 1) and where a career already has a floor to multiply, so a steeply banded add
     *  lands hardest exactly where it is least needed. Benched at [0.15, 0.35, 0.6, 1.0] it moved the
     *  owner's own week-933 row +44% on fame and +131% on worth, which is a retune of the top wearing
     *  an early-career label.
     *
     *  ⚠ THE SIZES ARE THE MEASUREMENT'S, not a guess, and the binding criterion is ROUND 32 #3'S OWN:
     *  that wave sized `value.unknownX` as «the highest value that still reads single digits on the
     *  shop row at his fame», and this wave may not undo it by pushing that fame back up. This is the
     *  largest gradient of its shape under which his w933 row still reads 9 years – fame 22.33 -> 23.69
     *  (+6.1%), the floor 12.85 -> 13.63. docs/specs/collaborations-as-early-fame-2026-08.md §7
     *  records predicted vs measured and the frontier either way.
     *
     *  ⚠⚠ ROUND 34 (03.09) – A FIFTH RUNG WAS PREPENDED BECAUSE `advertising.bands` GAINED A FIFTH
     *  BAND, AND THIS IS NOT A RETUNE: the four shipped rungs are unchanged to the digit and have
     *  simply moved one index to the right, so ≤200 is still 0.04, ≤100 still 0.06, ≤50 still 0.08
     *  and ≤10 still 0.11. Leaving the array at four entries would have been the silent defect –
     *  `shootFloorByBand[band] ?? 0` reads the TOP band's index, so the global house's shoots would
     *  quietly have started buying ZERO fame.
     *  ⚠ THE NEW ≤400 RUNG IS NOT A FIGURE THE OWNER SIZED – he approved the band and its cheques,
     *  and this is the arithmetic the prepend forced – SO THE SHIPPED GUARD PICKED IT rather than a
     *  preference. The ladder is 0.01 x [4, 6, 8, 11] and its own unit continued downward gives 0.03;
     *  0.02, the first DIFFERENCE continued downward, would stretch the whole ladder's span from
     *  2.75x to 5.5x and break round 32 #5's «a global house, not a hundred of them» bound (< 4x),
     *  which was measured rather than chosen. 0.03 keeps that bound at 3.67x and leaves the span
     *  ABOVE the round-32 anchor – the ≤200 rung upward – identical at 2.75x. The criterion sets the
     *  constant, exactly as `merch.crowd.refRoom` was solved backwards from its own anchor. */
```

## `fame.shootFloorHalfLifeByBand`

```ts
    /** ⭐⭐ ...AND IT IS FORGOTTEN FASTER THAN A TITLE, WHICH IS THE OTHER HALF OF HIS RULING. He put
     *  the decay question back with both halves of the tension named: «наверное истлевает (мало кто
     *  смотрит журналы 2 годичной давности) … с другой стороны "что попало в интернет осталось
     *  навсегда"».
     *
     *  ⭐⭐ THE TWO HALVES ARE TWO DIFFERENT THINGS AND SEPARATING THEM IS THE DESIGN. The CAMPAIGN'S
     *  NOISE – her face on a shelf this season – fades, and faster than a championship, which is a
     *  sporting fact recited in every broadcast for years. THE ASSOCIATION – «she was the face of
     *  Faro Automobiles» – does not expire, and it is carried by BRAND STRENGTH
     *  (`business.merch.strength`), not by a second permanent term in here.
     *
     *  ⚠ AROUND ONE SEASON, AGAINST A TITLE'S TWO. Half of a campaign is forgotten by the next
     *  winter, which is his magazine sentence as a number.
     *
     *  ⚠⚠ AND IT IS WHAT KEEPS THE TERM BOUNDED. A permanent per-shoot addition accumulates without
     *  limit over a twenty-season career and would need a cap chosen out of the air; a decaying
     *  pulse needs none, because a steady cadence of shoots converges.
     *
     *  ⭐⭐⭐ ROUND 32 #5 EXTENSION (31.08) – AND IT IS A LADDER RATHER THAN ONE NUMBER, BECAUSE REACH
     *  BUYS DURABILITY AND NOT ONLY VOLUME. THE OWNER: «у нас есть популярные сайты, журналы и
     *  бренды, а есть менее популярные, о которых знает мало людей … чем больше она была в сильных
     *  контрактах – тем больше у нее велосити». What shipped first scaled only the SIZE of the
     *  addition by the band and gave every band the same 52 weeks – so a global house and a local
     *  retainer were told apart by loudness and then forgotten at identical speed. A placement seen
     *  by millions leaves a mark that outlives its campaign; a flyer in one town is gone by the next
     *  season.
     *
     *  ⚠ HIS OWN EXAMPLE IS NOT THE ARGUMENT. He hedged it himself («как то женщин из номинации
     *  плейбоя помнят довольно долго … но может быть я ошибаюсь») and it has not been checked here,
     *  so it carries no weight. The general principle carries the design on its own.
     *
     *  ⚠⚠ THE TOP RUNG IS STILL SHORTER THAN A TITLE'S 104 WEEKS, which is the binding half of his
     *  earlier ruling and is not negotiable by this extension: a campaign is one season's wallpaper
     *  and a championship is recited in every broadcast for years. 78 weeks is a season and a half.
     *
     *  ⚠ THE SIZES ARE MEASURED, and the criterion is the one this ladder exists to satisfy: two
     *  careers with the SAME delivered shoots at different bands must diverge VISIBLY years later.
     *  At the shoot week the bands differ 2.75x (the sizes above); three years on this ladder has
     *  widened that to ~44x, because band 0 has faded through six half-lives and band 3 through two.
     *  ⚠ Band 2 is left at the shipped 52 on purpose – the anchor round 32 #5 was sized on does not
     *  move, so what this extension changes is the SPREAD and not the level.
     *  docs/specs/collaborations-as-early-fame-2026-08.md §11 records the frontier either way.
     *
     *  ⚠⚠ ROUND 34 (03.09) – A FIFTH RUNG, FOR THE SAME REASON AND ON THE SAME TERMS AS
     *  `shootFloorByBand` ABOVE. The four shipped half-lives are unchanged and have moved one index
     *  right (≤200 still 26, ≤100 still 39, ≤50 still 52, ≤10 still 78); the new ≤400 rung is this
     *  ladder's own 13-week step continued downward, a quarter of a year, and is the arithmetic the
     *  prepend forced rather than a figure the owner sized. */
```
