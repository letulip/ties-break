// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/shop.md#the-shop-block

/** ⭐⭐ THE SHELF (slice 1, docs/specs/the-shop-2026-08.md §3a/§3b/§3c). The parent's own money,
 *  and the first screen in this game where it is his to enjoy.
 *
 *  ⚠⚠ shop: A CONSTANT AND NOT SAVE DATA, which is the whole reason it lives here (spec §5).
 *  ⚠ shop: `annualRateBps` IS SIGNED AND THE SIGN IS THE POINT.
 *  ⚠ shop: SLICE 1 IS STATIC, AND «STATIC» MEANS DETERMINISTIC RATHER THAN FROZEN.
 *  → docs/notes/economy/shop.md#shop
 */
export const shop = {
  /** ⭐ THE RUNGS, cheapest first – the order they are read in and the order they are shown in.
   *  `stake: 'open'` is a product you choose an amount for (at least `entryCents`); `'fixed'` is a
   *  thing with one price. That distinction is §3a's, not a convenience: a deposit with a $1,000
   *  MINIMUM and a car with a $60,000 PRICE are different objects, and modelling the deposit as a
   *  $1,000 thing you buy would make every investment on this shelf decorative the moment the
   *  family had real money. */
  catalogue: [
    {
      id: 'deposit',
      family: 'investment',
      stake: 'open',
      label: 'A savings deposit',
      blurb: 'The dull one – it will not lose money and it will not make much.',
      entryCents: 1_000_00,
      // ⭐⭐⭐ ROUND 29 PART TWO #3 – 200 → 317 BPS, AND IT IS HIS RULING, NOT A TUNING.
      //
      // owner (shop.catalogue[0].annualRateBps): «не вижу проблем сделать ставку 3.17% на Savings.»
      // ⚠⚠ shop.catalogue[0].annualRateBps: 3.17% IS NOT A NEW NUMBER
      // owner (shop.catalogue[0].annualRateBps): «мы для этого делаем Savings как раз.»
      // ⚠ shop.catalogue[0].annualRateBps: THE OTHER HALF OF THE GAP WAS NEVER THE RATE, and part two #6 closes it
      // ⚠ shop.catalogue[0].annualRateBps: THE INDEX FUND IS UNTOUCHED at 700 bps.
      // → docs/notes/economy/shop.md#shopcatalogue0annualratebps
      annualRateBps: 317,
      // ⭐⭐ ROUND 30 #14 – A DEPOSIT IS HELD IN UNITS TOO, AND IT IS HIS OWN EXPECTATION, ROUND 29
      // #11: «Index fund хотелось бы иметь возможность докупать, предполагаю, что Savings deposit
      // будет вести себя так же – тоже надо исправить.» Adding to a holding and taking part of one
      // out is what `stake: 'open'` MEANS, and a holding you can do both to is a holding measured in
      // units. That is what let the rebase be deleted outright rather than kept for one rung.
      //
      // ⚠⚠ shop.catalogue[0].unitBaseCents: AND NOT ONE CENT OF THE DEPOSIT MOVED, WHICH IS ARITHMETIC AND NOT LUCK.
      // ⚠ shop.catalogue[0].unitBaseCents: $1,000 IS ITS OWN MINIMUM STAKE, chosen so the dullest rung on the shelf quotes the roundest…
      // → docs/notes/economy/shop.md#shopcatalogue0unitbasecents
      unitBaseCents: 1_000_00,
      // ⭐⭐⭐ T12, THE OWNER 14.09 – AND IT IS THE ROW HE CAUGHT. «у рабочей семьи, если вложить
      // все деньги сразу со стартом карьеры в депозит, сразу же приходят спонсорские деньги.» The
      // need gate under the cameo sponsor now reads `reachableFundsCents` (world/assets.ts), and
      // this flag is what tells it that money put here has not left the family. See `ShopItem.
      // cashParking` for why the mark is on the shelf rather than in the gate.
      cashParking: true,
    },
    {
      id: 'index-fund',
      family: 'investment',
      stake: 'open',
      label: 'An index fund',
      // ⭐⭐ AND NOW IT MAY SAY IT – ROUND 29 PART THREE #16. The note that stood here said the
      // blurb «may not describe a movement the engine does not make», because §3a's index fund
      // «can be DOWN for a whole season and still be the right holding» and slice 1 had no drift.
      // The engine makes that movement as of this item, so the second sentence is now a true
      // description of the thing rather than a promise about it.
      blurb: 'A slice of the whole market. It will have bad years – it has never had a bad decade.',
      // ⭐⭐⭐ ROUND 42 #13 – $5,000 → $1,000, AND THE REASON IS THAT NOTHING EVER DEFENDED THE $5,000.
      //
      // owner (shop.catalogue[1].entryCents), 15.09: «в индексный фонд можно только от 5к зайти, мне кажется это необосновано.»
      // ⚠ shop.catalogue[1].entryCents: ONE FLOOR FOR BOTH OPEN RUNGS NOW, which is what makes this a one-line change…
      // ⚠ shop.catalogue[1].entryCents: AND NOTHING ELSE MOVES, BECAUSE FRACTIONAL UNITS ARE ALREADY THE SYSTEM'S OWN ARITHMETIC.
      // owner (shop.catalogue[1].entryCents): «доли дадут возможность расти на горизонте и будут давать разные точки входа»
      // → docs/notes/economy/shop.md#shopcatalogue1entrycents
      entryCents: 1_000_00,
      // ⭐⭐⭐ ROUND 29 PART THREE #16 – THE DRIFT, AND IT DID NOT MOVE.
      //
      // owner (shop.catalogue[1].annualRateBps): «Механику фонда надо придумать, да, потому что безрисковые 3 против безрисковых 7 это»…
      // ⚠⚠ shop.catalogue[1].annualRateBps: 700 IS NOW THE LONG-RUN FIGURE RATHER THAN THE WEEK'S…
      // → docs/notes/economy/shop.md#shopcatalogue1annualratebps
      annualRateBps: 700,
      // ⭐⭐⭐ ...AND THIS IS THE RISK. See `world/market.ts` for the path and `ShopItem.volBps` for
      // what the field means. 1,800 bps of log-volatility.
      //
      // ⚠⚠ shop.catalogue[1].volBps: 1,800 IS A CEILING BEFORE IT IS A TUNING, AND THE ARITHMETIC IS WHY.
      // ⚠ shop.catalogue[1].volBps: AND IT IS ABOUT HALF A REAL INDEX'S VOLATILITY, which is a decision and not a mistake.
      // owner (shop.catalogue[1].volBps), 29.08: «например раз в 3-5 лет и стартовый сезон уже может быть как раз с -20%»
      // ⚠⚠ crises mean interval 4.01y (75.2% in his 3-5y band) · median depth −22.5% first-season fall 49.7% of careers…
      // ⚠ shop.catalogue[1].volBps: PROVISIONAL BY HIS OWN FRAMING
      // owner (shop.catalogue[1].volBps): «вроде посмотрел, давай сделаем, а я пощупаю и скажу свои ощущения потом.»
      // owner (shop.catalogue[1].volBps): «Волатильность индексного фонда какая-то очень большая по ощущениям +65/-15 это то»…
      // ⚠ shop.catalogue[1].volBps: THE KNOB THE SPEC ALREADY NAMED FOR THIS
      // ⚠⚠ shop.catalogue[1].volBps: HALVED, AND «HALF» IS THE RULING RATHER THAN A FITTED NUMBER.
      // ⚠ shop.catalogue[1].volBps: AND THE CEILING IS UNMOVED AND UNTOUCHED BY THIS
      // → docs/notes/economy/shop.md#shopcatalogue1volbps
      volBps: 900,
      // ⭐⭐⭐ ROUND 30 #14 – WHAT ONE UNIT COSTS AT THE START, and it is HIS anchor to the dollar:
      // «Зашёл, когда доля стоила 4к, через десять лет она может вполне удвоиться. Или зашёл на
      // пике при цене 7-8к.»
      //
      // ⚠ THE DOUBLING IS THE RATE AND NOT A SECOND CONSTANT. $4,000 at 700 bps is $7,869 after
      // ten years – «вполне удвоиться» – and it passes through his $7,000-8,000 peak band in the
      // ninth and tenth seasons of a career, which is where a family that has been earning long
      // enough to buy at a peak actually is. The market rides either side of that all the way.
      unitBaseCents: 4_000_00,
      // ⭐⭐⭐ T12, THE OWNER 14.09 – THE SECOND PARKING PLACE, and it is in for the same reason the
      // deposit is: «Это надо починить, чтобы поддержка приходила реально тогда, когда вообще уже
      // край и денег нет, а не только кошельком мыслить.» He named the deposit because that is
      // what he parked in; a fix that saw only the row he happened to use would have been the
      // same defect with one more week of life in it.
      //
      // ⚠ ITS WORTH MOVES AND THAT IS FINE, which is the one thing worth saying out loud about
      // this row rather than the deposit: `volBps` above means a fund holding can be worth less
      // than the family put in, and on a bad market year it can fall THROUGH the gate and let the
      // cameo write. That is not a leak – it is need, correctly seen, because the money the family
      // can actually reach really did shrink. `revalueAssets` has already priced it for the week.
      cashParking: true,
    },
    // ⚙ 26.08, the owner: «давай гэп сделаем скромнее пока что от 60 до 300к». A five-fold spread
    // rather than the twenty-two-fold one the first draft drew – from $60k to $300k every rung is
    // a real decision for a real career, and the ladder can always be extended upward later.
    //
    // owner (shop.catalogue[2]), 30.08: «Для машин вполне можно ввести годовую стоимость обслуживания»…
    // ⚠⚠ shop.catalogue[2]: WHY THE CARS HAD NONE UNTIL NOW, because it was a decision rather than an omission…
    // ⚠ shop.catalogue[2]: THE LAST ROW IS THE POINT OF THE LADDER, AND IT IS §3f's OWN DESIGN SENTENCE READ ONE FAMILY DOWN
    // ⚠⚠ shop.catalogue[2]: NOTHING HERE CAN STRAND A FAMILY, on §3f's own test
    // → docs/notes/economy/shop.md#shopcatalogue2
    {
      id: 'car-sensible',
      family: 'car',
      stake: 'fixed',
      label: 'The sensible estate',
      blurb: 'Five doors and a boot that takes the kit bags. Nobody looks at it twice.',
      entryCents: 60_000_00,
      annualRateBps: -600,
      upkeepBps: 500,
      upkeepGrowthBps: 600,
    },
    // ⭐⭐ ROUND 35 #5 – THE FOUR CARS NOW HAVE PAINTINGS, AND THREE OF THEM DESCRIBED A DIFFERENT
    // CAR. The owner asked for exactly this and named all four: «cars - есть арты для каждой
    // машины (универсал 60к, люкс внедорожник 110к, спорткар 190к, 4местный люкс кабриолет 300к)
    // надо и описания поправить немного с названиями».
    //
    // ⚠ shop.catalogue[3]: SO THIS IS THE ONE FAMILY WHERE CLAUDE.md INVARIANT 4 IS SATISFIED BY THE ITEM ITSELF
    // → docs/notes/economy/shop.md#shopcatalogue3
    {
      id: 'car-good',
      family: 'car',
      stake: 'fixed',
      label: 'The luxury four-by-four',
      blurb: 'Tall, quiet, and it will never once see a field.',
      entryCents: 110_000_00,
      annualRateBps: -900,
      upkeepBps: 550,
      upkeepGrowthBps: 600,
    },
    {
      id: 'car-nineteen',
      family: 'car',
      stake: 'fixed',
      // ⚠ NOT «the one he wanted at nineteen», WHICH IS §3b's OWN LABEL AND CANNOT SHIP. R15-7 is a
      // house rule with a test behind it (tests/coach-voice.test.ts): no string a player can read
      // calls anybody «he». The spec's phrase is about the PARENT, whose gender this game has never
      // fixed – the player is «the parent», never a father – so the pronoun would have been the
      // engine deciding something the onboarding deliberately does not ask. The picture survives
      // the edit; only the assumption goes.
      label: 'The one from the poster',
      blurb: 'Two seats, no boot, and the one that was on the bedroom wall.',
      entryCents: 190_000_00,
      annualRateBps: -1200,
      upkeepBps: 700,
      upkeepGrowthBps: 600,
    },
    {
      id: 'car-unreasonable',
      family: 'car',
      stake: 'fixed',
      label: 'The unreasonable one',
      blurb: 'Four seats, no roof, and no defence for any of it.',
      entryCents: 300_000_00,
      annualRateBps: -1500,
      upkeepBps: 900,
      upkeepGrowthBps: 600,
    },
    // ⭐ §3c – THE FIRST RUNG MATTERS MOST: «the earliest seasons are measured in debt, and a
    // family that finally owns where it lives is a real milestone this game currently has no way
    // to mark.» Two tiers in slice 1; the absurd end of that ladder waits.
    //
    // ⚠⚠ shop.catalogue[6]: THE TWO PRICES ARE MINE AND NOT THE SPEC'S
    // ⚠ shop.catalogue[6]: AND +3% IS THE SLOWEST POSITIVE RATE ON THE SHELF ON PURPOSE.
    // → docs/notes/economy/shop.md#shopcatalogue6
    {
      id: 'house-first',
      family: 'house',
      stake: 'fixed',
      label: 'A place of their own',
      blurb: 'The end of renting. Small, theirs on paper, and hers to paint.',
      entryCents: 240_000_00,
      annualRateBps: 300,
    },
    {
      id: 'house-garden',
      family: 'house',
      stake: 'fixed',
      label: 'The house with the garden',
      blurb: 'Room for all of them, and a garden nobody has to share.',
      // ⭐⭐ ROUND 35 #13 (03.09) – $520,000 -> $590,000, AND THE PAINTING WAS RIGHT ALL ALONG. The
      // owner: «Дом пусть будет за 590к - ок». His art for this rung has been named `property-590`
      // since round 35 #1, and round 35 #7 deliberately left the price alone because he had asked to
      // ADD two tiers and nothing else – see the note below, which was this rung's own record that
      // the stem and the price disagreed.
      //
      // ⚠ shop.catalogue[7].entryCents: NO SCHEMA MOVE, AND HE CLOSED THAT QUESTION HIMSELF
      // owner (shop.catalogue[7].entryCents): «Дом за 520к кто-то мог купить - никто не купил, нет игроков»
      // → docs/notes/economy/shop.md#shopcatalogue7entrycents
      entryCents: 590_000_00,
      annualRateBps: 300,
    },
    // ⭐⭐ ROUND 35 #7 – THE LADDER GETS ITS TOP TWO RUNGS, and the ask is one clause: «Добавится 2
    // тира домов еще: за 1.4м и за 3м». Both prices are HIS, to the digit, which is the whole
    // difference between these two rows and the two above them – §12b had to measure $240,000 and
    // $520,000 because the spec gave tiers and no numbers, and here the numbers came with the ask.
    //
    // ⚠ shop.catalogue[8]: THE RATE IS THE FAMILY'S OWN +3% AND IS NOT A THIRD DECISION.
    // ⚠ shop.catalogue[8]: AND NOTHING BELOW THEM MOVED **AT THE TIME**.
    // owner (shop.catalogue[8]): «Дом пусть будет за 590к - ок»
    // → docs/notes/economy/shop.md#shopcatalogue8
    {
      id: 'house-villa',
      family: 'house',
      stake: 'fixed',
      label: 'The villa with the pool',
      blurb: 'Glass, warm stone, and water that belongs to the family.',
      entryCents: 1_400_000_00,
      annualRateBps: 300,
    },
    {
      id: 'house-headland',
      family: 'house',
      stake: 'fixed',
      label: 'The house on the headland',
      blurb: 'Above the sea, with a pool that looks as though it falls into it.',
      entryCents: 3_000_000_00,
      annualRateBps: 300,
    },
    // ⭐⭐ ROUND 29 #5 – THE ELITE (§3f), AND THEY ARE NOT BOUGHT, THEY ARE COMMISSIONED.
    //
    // owner (shop.catalogue[10]): «Может что-то элитное добавить - яхты или самолеты?»
    // owner (shop.catalogue[10]): «тоже можно разные тиры сделать, кстати и потерю стоимости в год + годовое обслуживание»…
    // ⚠⚠ shop.catalogue[10]: SO EACH ONE CARRIES THREE NUMBERS AND NOT ONE
    // ⚠⚠ shop.catalogue[10]: THE UPKEEP PERCENTAGES ARE THE REAL ONES AND THAT IS WHY THEY HURT (§3f).
    // ⚠ shop.catalogue[10]: AND NOTHING HERE CAN STRAND A FAMILY, which is the house's «мы ни за что не наказываем» checked against the…
    // owner (shop.catalogue[10]): «до академии можно запустить свой бренд одежды (мерча) – это может стать хорошим шагом и подспорьем»…
    // owner (shop.catalogue[10]): «мерч, растущий от частоты и обилия рекламных контрактов, съемок, выступлений, титулов и прочего»
    // ⚠ shop.catalogue[10]: NO BUILD WAIT, NO UPKEEP AND RATE 0, the academy stages' own reading of §3g: the price is the decision…
    // → docs/notes/economy/shop.md#shopcatalogue10
    {
      id: 'merch-brand',
      family: 'business',
      stake: 'fixed',
      label: 'The merch brand',
      blurb: 'Her name on shirts and bags. It sells while she is talked about.',
      entryCents: 250_000_00,
      annualRateBps: 0,
      // ⭐⭐⭐ ROUND 30 #9 – AND IT IS NOW WORTH WHAT A BUSINESS IS WORTH: years of its own income,
      // which is years of her fame. `annualRateBps: 0` above is left where it is and is now DEAD for
      // this rung – `assetWorthCents` branches on `earningsMultipleX` before it reaches the rate –
      // and it is kept rather than deleted because the type requires it and because zero is the
      // honest answer to «what rate does it drift at»: none, it is priced off earnings.
      //
      // ⚠⚠ shop…earningsMultipleX: THE RESEARCH GAVE A BAND AND NOT A NUMBER, AND SAYS SO…
      // ⚠⚠ shop…earningsMultipleX: WHY THE BASE LIVES HERE AND THE LADDER LIVES IN `ECONOMY.business.merch.value`
      // ⚠ shop…earningsMultipleX: The measurement that picked this base against the earned ladder is…
      // ⚠ shop…earningsMultipleX: AND IT FALLS DURING HER CAREER, which is the only fall the game is in frame for…
      // → docs/notes/economy/shop.md#shopcatalogue10earningsmultiplex
      earningsMultipleX: 14,
    },
    // ⭐⭐⭐ ROUND 35 #8 – THE TWO BOTTOM RUNGS SWAPPED IDENTITIES, AND ONLY THEIR IDENTITIES.
    //
    // owner (shop.catalogue[11]): «water - карточки как на домах, все арты яхт в наличии, меням местами только: за 900к это парусник»…
    // ⚠⚠ shop.catalogue[11]: THE IDS DID **NOT** MOVE WITH THE IDENTITY THIS TIME, AND THAT IS A DELIBERATE DEPARTURE FROM THE PRECEDENT…
    // ⚠ shop.catalogue[11]: PRICE, BUILD TIME, RATE AND UPKEEP ARE UNTOUCHED ON BOTH ROWS
    // → docs/notes/economy/shop.md#shopcatalogue11
    {
      id: 'boat-launch',
      family: 'boat',
      stake: 'fixed',
      label: 'The sailing boat',
      blurb: 'Two cabins, a mast, and weekends that answer to the wind.',
      entryCents: 900_000_00,
      annualRateBps: -700,
      buildWeeks: 52,
      upkeepBps: 600,
    },
    // ⭐ ROUND 29 PART THREE P1 – THE MOTOR BOAT BECAME A SAILING YACHT, his ask verbatim: «моторка
    // $2.4М – давай переделаем на парусную яхту пожалуйста». He changed what it IS, never what it
    // costs: price, build weeks, annual loss and upkeep are the motor boat's own, untouched.
    //
    // ⚠ shop.catalogue[12]: ROUND 35 #8 READ THIS PARAGRAPH AND DID NOT DELETE A WORD OF IT
    // → docs/notes/economy/shop.md#shopcatalogue12
    {
      id: 'boat-sail',
      family: 'boat',
      stake: 'fixed',
      label: 'The small yacht',
      blurb: 'A flybridge, four berths, and a bay to be at anchor in.',
      entryCents: 2_400_000_00,
      annualRateBps: -700,
      buildWeeks: 78,
      upkeepBps: 600,
    },
    // ⭐⭐ THE TWO THAT GRANT THE WEEK (§3f, and it is the owner's own idea): «а неделя на яхте (при
    // наличии яхты) вполне может стать новой строкой отпуска, кстати».
    //
    // ⚠ shop.catalogue[13]: ONLY THESE TWO, AND THAT IS STILL THE NARROW READING OF «при наличии ЯХТЫ» ON PURPOSE
    // ⚠ shop.catalogue[13]: ROUND 35 #8 MOVED THE WORD «SAILING» ONE RUNG DOWN AND NOT ONE PENNY OF THIS.
    // → docs/notes/economy/shop.md#shopcatalogue13
    {
      id: 'yacht',
      family: 'boat',
      stake: 'fixed',
      label: 'The yacht',
      blurb: 'Crew of six, and a week of it is a week nobody can reach them.',
      entryCents: 12_000_000_00,
      annualRateBps: -500,
      buildWeeks: 156,
      upkeepBps: 1000,
      grantsVacationId: 'yacht-week',
    },
    {
      id: 'yacht-big',
      family: 'boat',
      stake: 'fixed',
      label: 'The big yacht',
      blurb: 'The one the harbour has to make room for.',
      entryCents: 28_000_000_00,
      annualRateBps: -500,
      buildWeeks: 208,
      upkeepBps: 1000,
      grantsVacationId: 'yacht-week',
    },
    // ⭐⭐ THE PLANE IS THE PARENTS', AND THE OWNER CORRECTED ME ON EXACTLY THAT (§3f): «Самолёт не
    // её, а родителей =) Теоретически может вполне резать косты на перелеты до соревнований,
    // почему бы и нет. По усталости по аналогии с кортом может 1 накинуть, не вижу причин не
    // делать, не такая большая величина».
    //
    // ⚠ shop.catalogue[15]: BOTH EFFECTS RIDE ON THE FAMILY, not on the rung
    // owner (shop.catalogue[15]): «air - карточки как на домах, добавляется небольшой самолет 8 мест за 7м»…
    // owner (shop.catalogue[15]): «у нас сейчас один активный за 18м, раньше был еще за 28м, а я прошу добавить второй за 7м с картинкой»
    // ⚠ shop.catalogue[15]: THE PRICE IS HIS AND THE OTHER THREE NUMBERS ARE THE FAMILY'S OWN.
    // ⚠⚠ shop.catalogue[15]: ITS BLURB DELIBERATELY DID NOT COUNT THE SEATS, AND ROUND 35 #13 IS THE WORD THAT CLOSED IT.
    // owner (shop.catalogue[15]), 03.09: «самолет 18м стоит (верно) мест пусть будет 10.»
    // ⚠ shop.catalogue[15]: THIS IS THE ONE KIND OF WORDING CHANGE INVARIANT 4 ALLOWS
    // → docs/notes/economy/shop.md#shopcatalogue15
    {
      id: 'plane-small',
      family: 'plane',
      stake: 'fixed',
      label: 'The small plane',
      blurb: 'Seven seats, short runways, and home the same night.',
      entryCents: 7_000_000_00,
      annualRateBps: -600,
      buildWeeks: 52,
      upkeepBps: 800,
    },
    {
      id: 'plane',
      family: 'plane',
      stake: 'fixed',
      label: 'The plane',
      // ⭐ ROUND 35 #13 – «Eight seats» -> «Ten seats», his own count («мест пусть будет 10»).
      // The PRICE he confirmed unchanged in the same breath: «самолет 18м стоит (верно)».
      blurb: 'Ten seats and no airport that keeps them waiting.',
      entryCents: 18_000_000_00,
      annualRateBps: -600,
      buildWeeks: 104,
      upkeepBps: 800,
    },
    // ⚠ ROUND 29 PART FOUR P10 – RETIRED, HIS RULING: «значит убрать этот самолет за 38М и всех
    // делов =)». The reachability measurement (72 careers x 780 weeks, the round-29 ledger)
    // found 0 of 72 ever took DELIVERY of one – nobody could hold the rung, and he removed it
    // rather than resizing it. The entry stays as a tombstone so a save that somehow owns one is
    // not stranded: it is still valued by its own rate, still billed its upkeep and still sells;
    // `retired` is only what keeps it off the shelf and out of `buyAsset`.
    {
      id: 'plane-long',
      family: 'plane',
      stake: 'fixed',
      label: 'The long-range plane',
      blurb: 'Melbourne without stopping, and a bed on the way back.',
      entryCents: 38_000_000_00,
      annualRateBps: -600,
      buildWeeks: 156,
      upkeepBps: 800,
      retired: true,
    },
    // ⭐⭐ ROUND 29 #5 – HER ACADEMY (§3g), THE END OF THE MONEY.
    //
    // owner (shop.catalogue[18]): «построить свою академию за много миллионов - тоже может быть интересно, кстати.»
    // ⚠⚠ shop.catalogue[18]: FOUR STAGES IN THE SPEC'S OWN ORDER
    // ⚠⚠ shop.catalogue[18]: THE FOUR PRICES ARE MINE AND NOT THE SPEC'S, exactly as the two house tiers were (§12b).
    // ⚠ shop.catalogue[18]: NO BUILD WAIT AND NO UPKEEP, because §3g asks for neither and this file does not invent what it was not given.
    // owner (shop.catalogue[18]), 12.09: «может быть для Академии корты, клубный дом и стафф тоже должны сколько-то строиться по»…
    // owner (shop.catalogue[18]): «сроки ок, в этот же раунд заводи пожалуйста»
    // ⚠⚠ shop.catalogue[18]: THE LAND DOES NOT BUILD, AND THAT IS HIS OWN LIST READ LITERALLY
    // owner (shop.catalogue[18]): «корты, клубный дом и стафф»
    // ⚠⚠ shop.catalogue[18]: THE THREE NUMBERS ARE THE ROUND'S PROPOSAL, WHICH IS WHAT HE APPROVED
    // ⚠⚠⚠ shop.catalogue[18]: AND NOT ONE LINE OF MACHINERY MOVED FOR THIS.
    // owner (shop.catalogue[18]), 07.09: «а что насчёт стоимости и индексации этой стоимости с годами?»
    // ⚠⚠ shop.catalogue[18]: WHAT HE WAS LOOKING AT WHEN HE SAID IT, 06.09
    // owner (shop.catalogue[18]), 06.09: «Академия при этом стоит ровно на месте – и это не очень корректно, как мне кажется.»
    // ⚠⚠ shop.catalogue[18]: ONE RATE AND NOT TWO, AND THE SPLIT IS REFUSED ON PURPOSE (the spec's §2).
    // ⚠ shop.catalogue[18]: THE SENTENCE ON THE CARD MOVES WITH THE NUMBER, AND NO STRING WAS EDITED TO MOVE IT.
    // ⚠ shop.catalogue[18]: The zero branch is now reachable from no rung on the shelf; it is KEPT…
    // ⚠ shop.catalogue[18]: THIS NOTE USED TO END «and the shelf says so in as many words («Holds its value»)» AND THAT SENTENCE IS GONE…
    // → docs/notes/economy/shop.md#shopcatalogue18
    {
      id: 'academy-land',
      family: 'academy',
      stake: 'fixed',
      label: 'The land',
      blurb: 'Twelve hectares outside town, and a name on the deeds.',
      entryCents: 2_000_000_00,
      annualRateBps: 300,
    },
    {
      id: 'academy-courts',
      family: 'academy',
      stake: 'fixed',
      label: 'The courts',
      blurb: 'Sixteen of them, and the lights that keep them open till nine.',
      entryCents: 3_000_000_00,
      annualRateBps: 300,
      requiresId: 'academy-land',
      // ROUND 41 #24 – «корты… должны сколько-то строиться по времени»; his «сроки ок».
      buildWeeks: 6,
    },
    {
      id: 'academy-building',
      family: 'academy',
      stake: 'fixed',
      label: 'The clubhouse',
      blurb: 'Gym, kitchen, forty beds and somewhere to do the homework.',
      entryCents: 4_000_000_00,
      annualRateBps: 300,
      requiresId: 'academy-courts',
      // ROUND 41 #24 – «клубный дом», the longest of the three: gym, kitchen and forty beds.
      buildWeeks: 12,
    },
    {
      id: 'academy-staff',
      family: 'academy',
      stake: 'fixed',
      label: 'The staff',
      blurb: 'Coaches, physios and the person who answers the telephone.',
      entryCents: 3_000_000_00,
      annualRateBps: 300,
      requiresId: 'academy-building',
      // ROUND 41 #24 – the STAFF is a hire rather than a build, and his band was «2–4» weeks.
      // One number out of the middle of it: notice periods, not concrete.
      buildWeeks: 3,
    },
  ],
  /** ⭐⭐ ROUND 29 #5, §3f – WHAT THE FAMILY'S OWN PLANE TAKES OFF A FARE, as a share of it.
   *
   *  ⚠ shop.planeTravelShare: THE OWNER…
   *  ⚠ shop.planeTravelShare: IT COMES OFF EVERY SEAT THE FAMILY PAYS FOR
   *  → docs/notes/economy/shop.md#shopplanetravelshare
   */
  planeTravelShare: 0.5,
  /** ⭐⭐ §3f – WHAT THE PLANE ADDS TO A WEEK SHE SPENDS TRAVELLING, in condition points.
   *
   *  owner (shop.planeTravelRestBonus): «По усталости по аналогии с кортом может 1 накинуть, не вижу причин не делать»…
   *  ⚠⚠ shop.planeTravelRestBonus: IT IS HIDDEN, AND THAT IS HIS OWN RULING ON THE COURT IT IS AN ANALOGY OF
   *  owner (shop.planeTravelRestBonus): «верно, но только если знают об этом, я предложил сделать бонус скрытым»
   *  ⚠ shop.planeTravelRestBonus: AND IT CANNOT STACK WITH THE COURT (§3d), by construction rather than by a cap…
   *  → docs/notes/economy/shop.md#shopplanetravelrestbonus
   */
  planeTravelRestBonus: 1,
  /** ⭐⭐⭐ ROUND 30 #15 – THE CEILING ON A RISING UPKEEP, as a multiple of its first-year figure.
   *
   *  owner (shop.upkeepGrowthCapX): «годовая стоимость обслуживания, которая может с каждым годом НЕМНОГО расти»
   *  ⚠⚠ shop.upkeepGrowthCapX: «НЕМНОГО» IS WHAT THIS NUMBER IS FOR.
   *  owner (shop.upkeepGrowthCapX): «мы ни за что не наказываем»
   *  ⚠ shop.upkeepGrowthCapX: IT BINDS THE MULTIPLIER AND NOT THE YEARS, deliberately
   *  → docs/notes/economy/shop.md#shopupkeepgrowthcapx
   */
  upkeepGrowthCapX: 2,
  /** ⭐⭐⭐ ROUND 30 #9 – THE FLOOR UNDER A BUSINESS RUNG'S VALUE, as a share of what was paid.
   *
   *  ⚠⚠ shop.businessValueFloorShare: IT IS THE MARK, AND IT IS A SOURCED IDEA RATHER THAN A KINDNESS.
   *  owner (shop.businessValueFloorShare): «мы ни за что не наказываем»
   *  → docs/notes/economy/shop.md#shopbusinessvaluefloorshare
   */
  businessValueFloorShare: 0.25,
  /** ⭐⭐⭐ ROUND 38 #16 (07.09) – A BRAND IS A PROCESS, NOT A PURCHASE.
   *
   *  owner (shop.worthRamp), 07.09: «если мы до пика известности бренд не покупали, то он всё равно поднимался в цене?»
   *  owner (shop.worthRamp): «полураспад 2 года при средней славе, кратно быстрее при высокой»
   *  ⚠⚠ shop.worthRamp: WHAT IT REPLACES AND WHY HIS SHAPE IS BETTER.
   *  owner (shop.worthRamp): «делая его более плавным»
   *  ⚠ shop.worthRamp: NO SCHEMA MOVE: the ramp is a function of `boughtWeek` and `paidCents`, both persisted since the shelf shipped.
   *  → docs/notes/economy/shop.md#shopworthramp
   */
  worthRamp: {
    /** the half-life of the gap between what was paid and what it is worth, at `medianDriver` */
    halfLifeWeeks: 104,
    /** ⚠ MEASURED, NOT PICKED: fame across the owner's 22 professional careers reads p10 3.2,
     *  MEDIAN 12.8, p90 39.3, max 81.3. So «средняя слава» is 12.8 and the pace is the ratio to it –
     *  p90 closes the gap three times faster, which is his «кратно быстрее». */
    medianFame: 12.8,
    /** ...and the academy's driver is REPUTATION above its 1.0 base, on its own scale. */
    medianReputationOver1: 1.8,
    /** ⚠ THE CLAMP THAT STOPS A DIVISION BY NOTHING. A career the world has never heard of has a
     *  driver at or near zero; without this the half-life is infinite and the rung would be frozen
     *  at what was paid for ever, which is not «медленно» but «никогда». Eight years is slow. */
    maxHalfLifeWeeks: 416,
    /** ...and the other end: a driver this far above the median stops buying more speed.
     *
     *  owner (shop.worthRamp.minHalfLifeWeeks): «свежекупленный бренд возвращался к своей стоимости уже в течение 5 недель»
     *  owner (shop.worthRamp.minHalfLifeWeeks): «полураспад 2 года при средней славе, кратно быстрее при высокой»
     *  → docs/notes/economy/shop.md#shopworthrampminhalflifeweeks
     */
    minHalfLifeWeeks: 52,
  },
  /** ⭐⭐⭐ THE SECONDARY MARKET – WHAT A BUYER OFFERS FOR A THING, AND HOW LONG THE BUYERS TAKE TO WRITE
   *  (docs/specs/secondary-market-2026-09.md §2c–§2d; added 29–30.09 by the secondary-market wave, step S1).
   *  Constants only: nothing here is save data, and the one reader is `engine/world/resale.ts`.
   *
   *  ⚠⚠ EVERY NUMBER IN THIS BLOCK IS A STARTING POINT AND NOT A MEASUREMENT. The spec proposes the six
   *  columns («all six columns are to be measured by the probe, none is final») and the shared knobs are
   *  the same kind of guess. Step S6's probe (`tools/sale-probe.ts`) replaces them with measured values,
   *  predicted against measured, per invariant 5. ⚠ ONE GAP TO MEASURE FIRST: `medianWeeks` sets the PEAK
   *  weekly chance (ln 2 / median) and the chance then decays with the ad's age, so the REALISED median
   *  wait is longer than the column says.
   *
   *  ⚠ `investment` IS DELIBERATELY ABSENT FROM `byFamily`, AND THE ABSENCE IS THE PREDICATE – the shelf's
   *  own idiom (`volBps?`, `buildWeeks?`, `requiresId?`: a rung's fields say what it is). Parked cash – the
   *  deposit and the index fund – never lists (spec §2a): it is money and not a thing, and it keeps
   *  today's instant partial sale. `secondaryOf(item)` reads `byFamily[item.family] ?? null`, so a family
   *  added to the union tomorrow is not sold by letter until somebody gives it a row here.
   */
  secondary: {
    /** ONE SHARED CAP, as a multiple of worth: «a lucky draw may land a touch ABOVE worth» (spec §2c) –
     *  waiting is occasionally delicious – and no further, so no class ever lists above ~1.05. */
    capX: 1.05,
    /** HOW LONG A FRESH AD KEEPS ITS VIEWINGS, in class medians: the weekly chance decays from its peak to
     *  `freshFloor` over this many medians (spec §2d says «~1–1.5×»; this is the upper end). */
    decayMedians: 1.5,
    /** THE THIN-MARKET DAMPENER, `(classEntry / worth) ** thinExponent` clamped to [thinFloor, 1]. Within
     *  a class a dearer lot sits in a thinner market (his «элитный авто за 300к вполне может быть не очень
     *  востребован»), as ONE continuous factor off worth against the family's cheapest rung – no per-rung
     *  data. The exponent is soft on purpose: five times the entry price costs ~40% of the buyers. */
    thinExponent: 0.3,
    /** ...and the clamp's low end: the thinnest a market ever gets. A buyer for a very dear lot is rare and
     *  never a third of nothing. Tunable. */
    thinFloor: 0.35,
    /** THE QUOTE'S «MAY NOT SELL AT ALL» LINE: the popup flags a lot whose dampener is at or below this
     *  (spec §2i – the screen prints the engine's verdict and never derives it). */
    thinQuoteAt: 0.5,
    /** THE HANGOVER (his ruling §5.4, «может даже чуть ниже на какое-то время»): for this many weeks after a
     *  crash arc CLOSES the class's price carries a small residual of the OPPOSITE sign to its crash
     *  response, decaying linearly to zero – half a season. */
    hangoverWeeks: 26,
    /** ...and how big it opens: this share of the response the class showed at that crisis's trough. */
    hangoverX: 0.25,
    /** ONE ROW PER FAMILY THAT CAN LIST, cheapest first as on the shelf. The columns:
     *  `medianWeeks` weeks to a first acceptable letter at the PEAK of an ad's freshness;
     *  `base` / `spread` the corridor's centre and half-width as a share of worth (a house clusters near
     *  its worth, a plane scatters low); `stalePerYear` the drift down as a listing ages, over a year;
     *  `crashShift` the SIGNED response to the market's crash depth, read as a beta – planes −1.0 fall one
     *  for one with the market, houses +0.2 gain a little from money fleeing to real assets (his «умеренно»);
     *  `crashArrival` the multiplier on the weekly chance while a crash arc is open;
     *  `fireX` the fire price as a share of worth – the corridor's own floor (spec §2f);
     *  `freshFloor` the miracle-buyer floor: the least a stale ad's chance ever falls to, as a share of its
     *  peak – never 0, houses keep real residual demand and a hung yacht almost none (spec §2d/§2i). */
    byFamily: {
      car: { medianWeeks: 4, base: 0.93, spread: 0.06, stalePerYear: 0.04, crashShift: -0.3, crashArrival: 0.8, fireX: 0.85, freshFloor: 0.1 },
      house: { medianWeeks: 16, base: 0.97, spread: 0.05, stalePerYear: 0.03, crashShift: 0.2, crashArrival: 1.2, fireX: 0.8, freshFloor: 0.15 },
      boat: { medianWeeks: 32, base: 0.88, spread: 0.1, stalePerYear: 0.06, crashShift: -0.8, crashArrival: 0.4, fireX: 0.65, freshFloor: 0.03 },
      plane: { medianWeeks: 44, base: 0.85, spread: 0.12, stalePerYear: 0.06, crashShift: -1.0, crashArrival: 0.4, fireX: 0.6, freshFloor: 0.03 },
      business: { medianWeeks: 52, base: 0.9, spread: 0.08, stalePerYear: 0.03, crashShift: -0.5, crashArrival: 0.6, fireX: 0.7, freshFloor: 0.05 },
      academy: { medianWeeks: 65, base: 0.92, spread: 0.08, stalePerYear: 0.04, crashShift: -0.4, crashArrival: 0.7, fireX: 0.75, freshFloor: 0.05 },
    },
  },
} as const
