---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The advertising block

The comment essays that stood above the `advertising` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `advertising`

```ts
  // =================================================================================================
  // THE ADVERTISING LADDER (round 24 item 2, docs/plans/the-face-and-the-court.md §6 STEPS 1-2;
  // the three rungs are round 29 part two #19/#20)
  // =================================================================================================
  //
  // THE OWNER: «Рекламные контракты будем добавлять какие-то?» – and the plan's answer is that the
  // kit ladder above is complete and ENDEMIC (tennis brands paying for tennis), so what is missing
  // is the other kind entirely: a non-endemic house paying cash for her FACE. Step 1 is the smallest
  // honest slice of it – one offer, results-gated, cash only; step 2 gives the cheque its price in
  // TIME (the shoot weeks below, §4a) – and the build stops there on the plan's own order: fame
  // (step 3+) is paused upstream with the private life.
  //
  // ⚠ WHERE THE GATE SITS WAS THE PLAN'S OWN MEASUREMENT (§3, the owner's two careers): at Ines'
  // level (24, interest $251,439 a year against $220,000 of ALL outgoings) an advertising cheque is
  // noise; at Alice's (18, interest $3,235 against $64,000 of outgoings) it is real money against a
  // real budget. So the deal belonged EARLY – mid-career, where the budget is still tight – which
  // inverts the instinct to gate it on the top ten.
  //
  // ⚠⚠ AND ROUND 29 PART TWO #20 IS THE OTHER HALF OF THAT ARGUMENT, WHICH NOBODY EVER BUILT. §3 is
  // right that a FIXED cheque decays into noise as she climbs; the conclusion it drew – so gate it
  // low and let it decay – only followed because there was one row. A rung sized on the stage it
  // opens for does not decay, and the ladder is on `houses` below, with the owner's own words, the
  // sourced comparison it was checked against, and the measured shares it is built from.
```

## `advertising.fromAgeYears`

```ts
    /** ⭐⭐⭐ ROUND 41 #15 (12.09) – SIXTEEN, AND THE EIGHTEEN THAT STOOD HERE WAS OUR READING RATHER
     *  THAN HIS RULING. That is the whole of the item and it is written down first, because the
     *  paragraph below is the evidence against itself.
     *
     *  ⚠⚠ WHAT THE SHIPPED COMMENT SAID, KEPT VERBATIM BECAUSE IT IS THE EXHIBIT: «The age the owner
     *  scoped advertising mechanics to («какие у нас могут быть механики этих контрактов
     *  дополнительные от 18+ лет начиная и дальше»). Eighteen is already the engine's threshold age –
     *  `kidShare.fromAgeYears` above starts her own prize split there, school is over by 18.92 for
     *  every birth month, the junior rungs shut – so the boundary exists and this reads the same
     *  clock (`kidAgeYears`, the one-clock ruling of 09.08).» ⚠ HIS SENTENCE ASKED WHAT EXTRA
     *  MECHANICS EXIST FROM 18 ONWARD. It was read as an ELIGIBILITY GATE, which is a different
     *  claim, and the three supporting facts are all true and none of them is about advertising.
     *
     *  HE CAUGHT IT HIMSELF, 12.09: «А рекламных контрактов правда не предлагают до 18 лет или это
     *  наше ноу-хау? кажется молодые тоже в рекламах снимаются.» AND HIS RULING, the same day, on
     *  the round's option A1: «реклама открывается с 16 (юниорские суммы, реже), а призовые падают
     *  на её счёт с первого старта W-серии независимо от возраста – согласен».
     *
     *  ⚠ THE CLOCK IS UNCHANGED – her REAL age through `kidAgeAt`, never the band's, the one-clock
     *  ruling of 09.08. Only the number moved, and the two years it opened carry the `junior` block
     *  below rather than the adult shelf. */
```

## `advertising.junior`

```ts
    /** ⭐⭐⭐ ROUND 41 #15 – THE JUNIOR BAND, and it is a BAND rather than four scattered multipliers
     *  on purpose: «юниорские суммы, реже» is one design sentence and it should be readable as one
     *  block. It governs exactly the real ages [16, 18); from her eighteenth birthday the shelf is
     *  byte-identical to what shipped, which is the property the bench arm is built to prove.
     *
     *  ⚠⚠ TWO CATEGORIES AND NOT SIX, AND THE PAIR IS THE SHELF'S OWN CHEAPEST RUNGS RATHER THAN A
     *  TASTE. `drinks` is the one category open at the very foot of the ladder (the ≤400 band's own
     *  cell – round 34's «a kit patch and a drink»), and `clothing` is the kit brand's second
     *  programme, which ALREADY requires a live kit deal to be written at all («двойной программой»,
     *  `reviewAdOffer`). So the junior shelf is: the drink she is photographed with, and the house
     *  that already dresses her putting her on a poster. A watch, a car, an airline and a fragrance
     *  are adult money for an adult face, and the real sport agrees – a fifteen-year-old signs an
     *  apparel deal, not a fragrance campaign.
     *
     *  ⚠ THE CAPSTONE AND THE LIFETIME LETTER ARE NOT ON THE LIST EITHER, and their own gates would
     *  refuse them anyway (four seasons ENDED inside the top 10 cannot exist at seventeen). Named
     *  rather than left to arithmetic: a gate that is unreachable today is a gate somebody deletes
     *  tomorrow.
     *
     *  ⚠ HALF THE CHEQUE AND HALF THE ARRIVALS – «юниорские суммы, реже», the two halves of his
     *  sentence, one number each. They are expressed in bps against the ADULT cell rather than as a
     *  junior price table, so the two shelves cannot drift apart on a retune: a new category cell,
     *  or a re-sized band, moves the junior figure with it by construction.
     *
     *  ⚠⚠ ONE YEAR, NEVER MORE, AND IT IS NOT A MULTIPLIER BUT A CEILING THE PAPER IS HELD TO. A
     *  multi-year deal signed for a minor is the thing his own round-34 complaint was about at the
     *  foot of the adult ladder («в 18 лет предлагают подписать копеечные контракты на 2 и 3 года»),
     *  and it is worse at sixteen: it would bind a career through the two years it changes most.
     *  ⚠ The bands a sixteen-year-old can actually reach write one year anyway (≤400 and ≤200 are
     *  both `termYearsMin: 1, termYearsMax: 1`), so this ceiling binds only a prodigy inside the top
     *  100 – which is exactly the case that needed deciding rather than left to a band table. */
```

## `advertising.bands`

```ts
    /** ⭐⭐⭐ ROUND 29 PART TWO #19/#20 – THE LADDER, WHICH IS WHAT THIS CATALOGUE DID NOT HAVE.
     *
     *  HIS TWO QUESTIONS, and the second one invited correction: «я не увидел наш список спонсоров
     *  для съемок и прочего, не спортивных. С ними что и на каких уровнях и что дают… Хочу увидеть
     *  их список и что дают.» and «предлагать контракт за 20к долларов на год для 100 и выше ракетки
     *  мира выглядит весьма сомнительно, как мне кажется, поправь меня, если я ошибаюсь.»
     *
     *  ⚠ HE IS RIGHT, AND THE MEASUREMENT SAYS SO MORE SHARPLY THAN HE DID – see
     *  `docs/research/off-court-money.md`, which reads the WTA's own prize-money list and the Forbes
     *  2025 earnings table rather than quoting either at second hand. In the real sport off-court
     *  money is not flat and it is not ordered by rank: the woman with the second-largest endorsement
     *  income in 2025 was the THIRTIETH-largest prize-money earner ($21M off court against $1.6M on
     *  it), and no non-endemic contract value has ever been published for anybody outside the top 25
     *  at all. What was shipped here was ONE house, $20,000, with a floor at WTA #200 and **no
     *  ceiling of any kind** – so the world #21 in his own save was offered exactly what the #199 is.
     *
     *  ⭐ AND THE $20,000 ITSELF SURVIVES. The research does not contradict it at the rung it was
     *  written for; what it contradicts is the same cheque still arriving eleven rungs later. So this
     *  is a LADDER and not a retune: the bottom row is the shipped deal, unchanged to the cent.
     *
     *  THE SIZING PRINCIPLE IS THE ONE THE SHIPPED COMMENT ALREADY STATED – a rung is a SHARE OF THE
     *  OUTGOINGS OF THE STAGE IT OPENS FOR, not an absolute sum – with one correction it needed. The
     *  old comment sized $20,000 as «about 31% of Alice's-stage ANNUAL outgoings ($64,000)», read
     *  off ONE career. Measured across 108 careers x 780 weeks (`tools/sponsor-ladder-reach.ts`) the
     *  median annual outgoings of a season spent in that band are **$86,474**, so the shipped rung's
     *  own realised share is **23.1%** – and THAT is the rule, because the anchor sets it and the
     *  rungs above it obey. Nothing here was picked and then justified:
     *
     *    band          median annual outgoings   this catalogue   realised share   $ per shoot week
     *    WTA 51-200           $86,474                 $20,000           23.1%           $10,000
     *    WTA 11-50           $173,210                 $40,000           23.1%           $10,000
     *    WTA 1-10            $240,343                 $55,000           22.9%            $9,167
     *
     *  ⚠⚠ THE DENOMINATOR MOVED UNDER THIS VERY WAVE AND THE FIRST SIZING WAS TAKEN AGAINST THE OLD
     *  ONE – recorded because it is the more useful fact. Measured before items #5 and #12 the three
     *  medians were $100,435 / $254,972 / $348,855; after them they are the figures above, because a
     *  career that can now be written to by `premium` and `icon` mid-contract gets half to three
     *  quarters of its FARES paid and more of its kit, so what a season costs her falls. The fees are
     *  sized against the world as it now is, and the run that produced these numbers is the one in
     *  the ledger. ⭐ The anchor is unchanged either way: $20,000 is what it is, and the two rungs
     *  above it hold ITS realised share rather than a round number picked first.
     *
     *  ⚠ THE PER-SHOOT COLUMN IS THE CROSS-CHECK AND IT AGREES, WHICH IS WHY IT IS PRINTED. Sized
     *  the other way round – what a week of her season is worth – the three rungs come out at
     *  $10,000, $10,000 and $9,167 a shoot week. Two independent readings of the same catalogue
     *  landing within 8% of each other is what makes this a rule rather than three numbers.
     *
     *  ⚠ A CONSTANT SHARE IS A DECISION AND IT OVERRULES §3 OF THE PLAN, WHICH SAID THIS MECHANIC
     *  ONLY MATTERS EARLY. That was the right reading of a catalogue with one row: a fixed cheque
     *  does decay into noise as she climbs. A rung sized on the stage it opens for cannot – it is the
     *  same fifth of the same budget at every stage, which is what «felt, not budget-solving» has to
     *  mean once there is more than one rung. It is deliberately NOT the real curve, which is convex
     *  to the point of absurdity (Gauff: $25M off court against $8M on it); a game that copied that
     *  would make the top rung solve the endgame, and the endgame is not short of money.
     *
     *  ⚠ AND THE ENDEMIC LADDER STILL OUT-EARNS THE PHOTOGRAPH AT EVERY PROFESSIONAL RUNG, which is
     *  the relationship the shipped comment named and this one keeps: $40,000 against `premium`'s
     *  $30,000 retainer + $15,000 appearance fee + $8,000 of kit + half the fares + 25% bonuses;
     *  $55,000 against `icon`'s $150,000 retainer + $40,000 appearance fees + 30% bonuses.
     *
     *  ⚠⚠ THE GATES ARE THE KIT LADDER'S OWN PROFESSIONAL CUTS, READ AND NOT SHARED. 200 / 50 / 10
     *  are `tour` / `premium` / `icon`'s `maxWtaRank`, which is the shipped rung's own derivation
     *  («a non-endemic brand notices her exactly when the first endemic cash does») extended upward
     *  with the same argument. They are written out here rather than imported, exactly as the
     *  original 200 was and for the same reason: a kit retune must never silently retune advertising.
     *  ⭐ And they are REACHED – `tools/sponsor-ladder-reach.ts` measures 45% of careers ever inside
     *  WTA #50 and 29% ever inside #10, so neither new rung is a row nobody sees.
     *
     *  ⚠⚠ THE SHOOT WEEKS ARE THE PLAN'S RECORDED LADDER, AND THEY ARE WHY IT STOPS AT THREE ROWS.
     *  `the-face-and-the-court.md` §4a-1 wrote down «bigger campaigns would carry 3-4 shoot weeks, a
     *  global house 5-6, and the sum of live deals must never exceed 6 shoot weeks a year». Taking
     *  the top of each band – 2 / 4 / 6 – spends the whole annual allowance on the top rung, so the
     *  cap is STRUCTURAL rather than a rule somebody has to remember: one deal at a time
     *  (`adSpokenFor`), every term exactly one year (`termWeeks: 52`), so the most she can ever owe
     *  in a year is the biggest single house's six. A fourth rung would have nothing left to ask for.
     *
     *  ⭐ WHAT THE BIGGEST HOUSE ACTUALLY COSTS HER, since round 29 #3 made a shoot on a tournament
     *  week a four-way decision: SIX of her 49 in-season weeks, 12% of the playing year, each
     *  recovering like a travel week instead of a rest week (measured at -9 condition per deficit
     *  shoot week, `docs/specs/ad-shoot-recovery-2026-08.md`) and each one a week she must either
     *  keep clear or pay `clashConditionPerDay` x 7 to play through.
     *
     *  ⚠⚠⚠ ROUND 29 PART FOUR P6/§6–§8 SUPERSEDES THE THREE-ROW LADDER ABOVE, BY THE OWNER'S OWN
     *  CALIBRATION, and the history stays because it explains what the anchor is. His three moves,
     *  in order (docs/research/endorsement-tiers-and-academy-money.md §6–§8):
     *   1. «Это доход у топ-100, у топ-50 точно больше» – Bublik's $1–2M/yr portfolio is a TOP-100
     *      figure, so the bands LIFT and a #100 gate joins the kit ladder's own 200/50/10;
     *   2. the portfolio is CATEGORIES – «одежда и обувь · часы · автомобили · гидратация и
     *      напитки», one live deal per category, kit brands writing ad campaigns as a second
     *      programme («Можно даже текущих использовать двойной программой»);
     *   3. the GRADIENT – «на каждой ступени может быть до 4-6 одновременно, только с разными
     *      чеками»: the portfolio SHAPE is constant at every band and the CHEQUE is the only axis
     *      that scales.
     *  The 23.1%-share sizing rule above therefore holds for exactly ONE cell of the new table –
     *  the watches fee at the ≤200 band, $20,000 unchanged to the cent, the anchor everything else
     *  was once derived from – and the cells above it are HIS band ranges (§8, movable, his), not
     *  shares: at real scale off-court money is 32–99% of an annual income (§4c), so no share of
     *  outgoings can reach his line and the resize is a chosen point on the measured dial. */
    /** ⭐⭐⭐ THE GRADIENT'S BANDS (round 29 part four, §8 – his final shape), weakest-first like
     *  every ladder in this file, so an index comparison is a band comparison everywhere.
     *
     *  ⚠⚠ THE GATES ARE THE KIT LADDER'S OWN PROFESSIONAL CUTS PLUS HIS OWN #100. 200 / 50 / 10 are
     *  `tour` / `premium` / `icon`'s `maxWtaRank`, read and not imported (the shipped rule: a kit
     *  retune must never silently retune advertising); 100 is the Bublik line, P11 verbatim: «Это
     *  доход у топ-100, у топ-50 точно больше» – the one band the kit ladder never had, added
     *  because his data point sits exactly on it.
     *
     *  ⚠ THE SHOOT ASK RISES WITH THE BAND AND THE WINTER NOW CARRIES IT (P9, §6: «shoot capacity
     *  rises because the winter now carries them»). One week per deal-year at the two lower bands,
     *  two at the two upper – so a full ≤10 shelf of six deals asks 12 weeks a year against a
     *  6-week winter, and the spill into the season is Zheng's own complaint made mechanical:
     *  «слишком много съёмок и никакого отпуска». The overflow meets the round-29 #3 four-way
     *  clash exactly as an in-season shoot always did.
     *
     *  ⭐⭐⭐ ROUND 34 #7/#11/#12/#13 (03.09) – A FIFTH BAND IS PREPENDED AT ≤400, AND THE FOOT OF THE
     *  LADDER IS THE ITEM. The owner, playing his own save at world #113: «в 18 лет предлагают
     *  подписать копеечные контракты на 2 и 3 года … в фильме Финальный сет показывали, что игроку
     *  на 240 месте в мире предлагают контракты за 5к за каждый сыгранный матч с нашивкой спонсора.
     *  У нас сейчас 5000-12000 в год да ещё и на расцвет карьеры» – and, twice more, «129 место в
     *  мире, тот же контракт на 12к в год на 3 года. Не верю» and «99 место в мире, тот же контракт
     *  на 20к в год на 2 года».
     *
     *  ⚠⚠ ABOVE THE TOP 100 NOTHING MOVED, ON HIS OWN EXPLICIT RULING: «Про 50–100 отвечаю прямо:
     *  пересматривать не надо». The ≤100 / ≤50 / ≤10 cells below are the round-29 catalogue to the
     *  cent; only the two rungs BELOW the top 100 are round 34's, and the two cliffs they remove are
     *  «nothing at all below 200» and a 24x jump on a single ranking place from #101 to #100.
     *
     *  ⚠ 400 IS A NEW GATE AND IS NOT A KIT CUT – the three above it still are. It is the owner's own
     *  film anchor read onto the table: ~$5,000 a match under a sponsor's patch at ~40 matches a year
     *  is $200,000 a year for the world #240, and the band that has to hold him has to reach past
     *  #240. ⭐ Checked against the engine rather than assumed: a career in this band plays 22 events
     *  ≈ 44 matches a year, so the film's arithmetic and ours agree. */
    // ⭐⭐ ROUND 39 #3 (08.09) – THE TERM LADDER, his approved shape cell for cell: the rising career
    // (≤400/≤200) signs one year only, the top 100 up to two, the top 50 up to three, the top 10
    // two to five – «в спорте я видел, что они и на 5, и на 10 лет заключают», and the 5 lands
    // here while the 8-year capstone and the lifetime letter carry the top end he named. ⚠ The
    // MEASURED defect this replaces: a flat 1–3 at every band – «at wta#5 she signed a 3-season
    // kit; at wta#91 she signed a 2-season one; the 3-year ad deals land at wta#7 and wta#16
    // alike» (his save, tools/r39-save-read.ts --report).
```

## `advertising.categories`

```ts
    /** ⭐⭐⭐ THE PORTFOLIO'S CATEGORIES (P7, his own list mapped onto ours) – the shelf the player
     *  sees, one live deal per category, the cheque per band in each row.
     *
     *  THE FEES WERE §8'S TABLE, CELL BY CELL, and landed inside his ranges by construction (the
     *  in-band test pins every cell): ≤200 $5k–20k · ≤100 $100k–500k · ≤50 $300k–1M · ≤10
     *  $1M–2.5M. Portfolio-per-year at each band, all categories filled: $45k · $1.1M · $2.6M ·
     *  $9.2M – against his own column «$30k–80k · ~$1–2M (Bublik) · ~$2.5–4M · ~$6–10M with kit».
     *  ⚠ ROUND 34 REWROTE THE TWO ROWS BELOW THE TOP 100 and left the three above it alone, so the
     *  ranges now read ≤400 $80k–120k · ≤200 $50k–200k · ≤100 $100k–500k · ≤50 $300k–1M · ≤10
     *  $1M–2.5M, and the portfolio-per-year column is $200k · $450k · $1.1M · $2.6M · $9.2M.
     *
     *  ⭐ THE ANCHOR SURVIVED A SECOND RESIZE UNMOVED: watches at ≤200 was the shipped $20,000 to
     *  the cent – the one cell the 23.1%-share rule still governed, and the cell every earlier
     *  number in this file's history was derived from.
     *
     *  ⚠⚠ AND ROUND 34 #7/#11/#12/#13 (03.09) IS WHERE THAT ANCHOR FINALLY MOVES, WHICH IS SAID OUT
     *  LOUD RATHER THAN LEFT FOR A READER TO NOTICE. The owner played eleven seasons in and around
     *  the top 100 and read the letters: «в 18 лет предлагают подписать копеечные контракты на 2 и 3
     *  года», «129 место в мире, тот же контракт на 12к в год на 3 года. Не верю», «99 место в мире,
     *  тот же контракт на 20к в год на 2 года». Two rungs BELOW the top 100 were rewritten and the
     *  cells above it were not touched at all («Про 50–100 отвечаю прямо: пересматривать не надо»):
     *
     *    band        was        now      what changed
     *    ≤400        –          $200,000 a new band: a kit patch and a drink, nothing else
     *    ≤200        $45,000    $450,000 the four open cells x10, their SHAPE preserved exactly
     *    ≤100        $1,100,000 unchanged
     *    ≤50         $2,600,000 unchanged
     *    ≤10         $9,200,000 unchanged
     *
     *  ⭐ HIS OWN HEDGE WAS RIGHT AND IS RECORDED AS SUCH: «может быть для нашего масштаба наша
     *  система нормальная, цифры только на первом тире и условия не очень». The ladder's SHAPE –
     *  the 2.4x / 2.4x / 3.5x it steps above the top 100, one deal per category, the cheque the only
     *  axis that scales – is the round-29 design untouched. It was the FOOT that was broken.
     *
     *  ⚠ A `null` CELL IS THE GATE: the category has not opened at that band. Drinks and the kit
     *  brand's poster campaign open at ≤400 (round 34's new rung – a patch on the shirt and a
     *  drink); watches and cars join them with the first real professional cash (≤200 – «A #180
     *  holds a watch deal, a drinks deal, a local car dealer: small money, same shelf», §8); the
     *  airline waits for the top 100; fragrance is the icon-band category (§7: «watches early, cars
     *  at top-100, fragrance at top-10»). Derived, never a second constant, so the gate and the
     *  price cannot disagree.
     *
     *  ⚠⚠ THE PER-CATEGORY LADDER IS NO LONGER MONOTONE AND THAT IS THE APPROVED TABLE, NOT A SLIP.
     *  Three cells sit level or fall as the band rises – clothing $120,000 at ≤400 against $50,000
     *  at ≤200, drinks $80,000 at both, watches $200,000 at both ≤200 and ≤100 – because what the
     *  owner approved is the BAND TOTAL ($200,000 / $450,000) and the shelf's SHAPE at each band,
     *  not a rule about one category's own climb. A #380 who is dressed and hydrated by two houses
     *  out-earns a #180 in clothing alone, and is out-earned four times over on the shelf as a whole.
     *  ⚠ It cost `adBandOfTerms` its old premise («the ladders are strictly increasing wherever they
     *  are not null»); see that function for what replaced the walk and what is still ambiguous.
     *
     *  ⚠ 2–4 HOUSES PER CATEGORY IS P6'S CHURN MADE VISIBLE – terms run 1–3 years and a house may
     *  not write twice running at the top band (`pickAdHouse`), so the shelf shows different names
     *  across a reign: «игрок устанет смотреть на одно и то же название без смены ГОДАМИ». Every
     *  name is fictional and constructible into no real company or trademark.
     *
     *  ⚠ CLOTHING HAS NO HOUSES OF ITS OWN, BY DESIGN («двойной программой»): the writer is the
     *  live kit deal's brand – Baseline Athletic paying for her racket bag AND a poster campaign
     *  is two deals, one brand, separate letters, separate money. No kit deal, no clothing
     *  campaign; the kit paper stays entirely the kit ladder's. */
```

## `advertising.capstone`

```ts
    /** ⭐⭐⭐ THE CAPSTONE (P6, approved twice – §6 «D … очень хорошо» and §8's own last row): the
     *  one kit-shaped deal on top of the whole shelf. His anchor sentence, verbatim: «Федерер
     *  получал контракт с Nike на 10+ миллионов, это 1-2млн для родителя.»
     *
     *  ⚠⚠ THE GATE IS TENURE, NOT A RANK READ TODAY: four seasons ENDED inside the world's top 10,
     *  counted off `seasonHistory[].byTrack.wta.endRank` – banked once a season at the wrap,
     *  never pruned, already persisted, so the gate is a fold over an existing field and NO schema
     *  moves (65 stays). Measured before it was picked: 4+ seasons in the top 10 is the top ~10%
     *  of careers (7 of 72, the round-29 reachability run), which is what a career-crowning deal
     *  should cost.
     *
     *  ⚠ KIT-SHAPED MEANS THE SHAPE, SAID PRECISELY: eight years, one at a time, the writer is the
     *  kit house that already dresses her (the double programme at icon scale – his Federer/Nike
     *  sentence is a kit brand paying for a FACE), falling back to the icon rung's own brand when
     *  she happens to be between kit deals so the gate he ruled is the only gate there is. It pays
     *  cash for her face through `bankSponsorCheque` like every ad deal – NOT kit, fares or
     *  bonuses – and its year-fee lands each anniversary (`payAdAnniversaries`). */
```

## `advertising.lifetime`

```ts
    /** ⚠ `termYearsMax: 3` STOOD HERE AND ROUND 39 #3 MOVED THE TERM ONTO THE BAND (owner 08.09,
     *  «давай так попробуем, как ты предложил»). Its note called 1–3 «the research's own law for
     *  non-endemic paper», and the flat law was the measured defect: at wta#5 and wta#91 alike the
     *  ladder wrote the same 1–3 draw, and NOTHING above three years existed in the game at all.
     *  The band's own `termYearsMin`/`termYearsMax` carry the ladder now – 1y for the rising
     *  career, up to 5y at the top – and the churn note survives where it is still true: short
     *  paper at the foot is what makes the 2–4 houses per category rotate. */
    /** ⭐⭐⭐ ROUND 39 #3 – THE LIFETIME LETTER («А некоторые и пожизненно»), once per career, at
     *  legend status: the icon exception the research names (Messi, Ronaldo, LeBron), mostly
     *  outside tennis, so it is ONE letter and not a band.
     *
     *  ⚠⚠ THE GATE IS THE CAPSTONE'S OWN TENURE READ PLUS THE ONE THING THE CAPSTONE NEVER ASKS: a
     *  Slam title. Four seasons ended inside the top 10 – `capstoneSeasonsOf`, the same fold, never
     *  a second derivation – AND at least one Slam on the trophy ledger. A lifetime deal is written
     *  to a legend, and in this sport a legend without a Slam is not one.
     *
     *  ⚠ THE FEE IS THE ICON BAND'S OWN BIGGEST TRADE CHEQUE, MADE PERMANENT – fragrance's
     *  $2,500,000, the top cell of the ordinary shelf – and NOT a second capstone: the real
     *  lifetime deals pay roughly a peak year-fee forever, and the game's peak ORDINARY fee is
     *  this cell. $10M/yr forever beside the capstone's $10M x 8 would double the top of the
     *  economy; the annuity shape – top-shelf money that never expires and survives retirement –
     *  is the «пожизненно» he named, and the walk (tools/r39-terms-walk.ts) is the measurement.
     *
     *  ⚠ ZERO SHOOT WEEKS, deliberately: shoot weeks are named at signature for the whole term,
     *  and a term with no end has no «whole term» to name them across. The house pays for the name
     *  she already made; the letter asks nothing back – which is also what lets it survive
     *  retirement without owing weeks she no longer has. */
```

## `advertising.lifetime.seasonsInTop10`

```ts
      /** ⭐⭐ THREE, NOT THE CAPSTONE'S FOUR, AND THE NUMBER IS MEASURED (owner, 08.09: «тогда окей
       *  и не вижу причин это не сделать»). His questions were «не будет ли это большим облегчением?
       *  сколько реально игроков в % … какая ценность будет?», and `tools/r39-tenure-reach.ts`
       *  answered them over the round-29 corpus shape – 9 presets x 2 policies x 6 seeds = 108
       *  careers, 900 weeks:
       *
       *      >= 4 top-10 seasons AND a slam    11 of 108   10.2%
       *      >= 3 top-10 seasons AND a slam    11 of 108   10.2%
       *
       *  ⚠ IDENTICAL - the two careers holding exactly three top-10 seasons hold ZERO slams, so the
       *  SLAM is the binding gate and this number was never doing the work it looked like it was
       *  doing. Dropping it is therefore not a loosening: it costs nothing measurable, and it is the
       *  difference between his own best career (Ines: 3 seasons + a slam) earning the letter and
       *  never learning the mechanic exists. ⚠ The capstone above stays at FOUR - it is tenure
       *  without a title, and it is right for that to be the stricter bar. */
```

## `advertising.clashConditionPerDay`

```ts
    /** ⭐⭐ ROUND 29 #3 – WHAT SHOOTING AND PLAYING IN THE SAME WEEK COSTS HER, PER DAY OF THAT WEEK.
     *
     *  THE OWNER'S OWN FIGURE, verbatim: «+1 в день, т.к. съемка занимает не один час, то нагрузка
     *  будет мощной на всю неделю». So it is one condition point per day and it is charged across
     *  the WHOLE week rather than per shoot slot – his sentence says why: a shoot is not an hour,
     *  and the load it leaves is the week's, not the afternoon's.
     *
     *  ⚠ IT IS A PRICE AND NOT A REFUSAL. Round 28's shoot week is «not blocked and not
     *  double-charged» and that still holds everywhere else; this is the one week the owner asked to
     *  be paid for, and only when the parent has CHOSEN to have both – the other three answers to
     *  the collision remove it (see `world/shootClash.ts`).
     *
     *  ⚠ PER DAY, MULTIPLIED BY THE WEEK'S DAYS AT THE ONE SITE THAT CHARGES IT
     *  (`accrueCondition`). Written as a rate rather than as a total because that is the shape he
     *  named it in, and because a week is seven days everywhere in this engine – the plan matrix,
     *  `planWeek`, the calendar grid – so the multiplication has one honest reading.
     *
     *  ⭐⭐ ROUND 45 #1b, 02.10 – THE DAYS BECAME THE SHOOTING DAYS, and the paragraph above is now the
     *  history of why it was seven. Shown the condition table's «shoot week −7», the owner: «неделя
     *  съёмок… давай по 1 за каждый съемочный день, это может быть вполне справедливо». The multiplier
     *  is `clashShootDays(world)` (`world/medical.ts`): the days the entered event RUNS, `log2(drawSize)`
     *  – 3 local, 4 regional, 5 for every 32-draw, 6 the 1000, 7 the Slam – which is also how many days
     *  the schedule draws the Shoot block on a «do both» week (`tripMatchDay` hangs `TRIP_SHOOT` on
     *  every match day), so the picture and the charge are one sentence again. The rate stays 1; the
     *  clash card (`buildShootClashPrompt`) multiplies by the same function, so it prints the engine's
     *  number. Seven survives as the Slam's price and nothing else's.
     *
     *  ⭐⭐ ROUND 45 #1b REFINED, 02.10 (THIRD BATCH) – THE SHOOT IS TWO DAYS, THREE EACH, SIX AT EVERY RUNG. The paragraph
     *  above is the first build's history. Shown it, the owner: «у нас же там когда съемки + турнир нагрузка сильнее, но съемочных дней всего 2… можно за каждый съемочный день по 2 или даже по 3 кондишна снимать. Что думаешь?» – ruled with the architect's
     *  concurrence: the clash shoot is 2 days, each costing 3, so 6 per clash, flat across tiers (near the historical 7; a clash
     *  day at 3 is properly heavier than a calm shoot day, which stays unpriced). `clashConditionPerDay` is 3 and `clashShootDays`
     *  is the constant `CLASH_SHOOT_DAYS` = 2 (`world/medical.ts`), no longer `log2(drawSize)`; the charge and the card still
     *  multiply by the one function. The schedule «redraws the Shoot block on exactly two trip days» – `tripMatchDay` hangs
     *  `TRIP_SHOOT` on the trip's first two match days only (`TRIP_SHOOT_DAYS`, composables/weekGrid.ts); the per-match-day
     *  drawing was round 30's agent choice, never his. */
```

## `advertising.decideWeeks`

```ts
    /** HOW LONG THE PARENT HAS TO THINK, in weeks, counted INCLUSIVELY from the week the letter
     *  lands: the deadline is `arrival + decideWeeks - 1`, so five means the arrival week and the
     *  four after it, and the letter is still answerable on the last of them.
     *
     *  ⚠ FOUR → FIVE, ROUND 28 #2, AND IT SETTLES A DISAGREEMENT RATHER THAN TUNING A NUMBER. The
     *  owner: «Предложение от спонсора с часами пришло на сорок четвёртой неделе А на сорок восьмой
     *  уже истёк срок рассмотрения мне казалось мы договаривались про 5 недель». He is describing
     *  this letter exactly – `brand` below is the watchmaker – and the arithmetic he read off the
     *  screen was right: at four, a letter filed on W44 died on W47 and was already gone when he
     *  looked on W48.
     *
     *  ⚠⚠ AND THE FIVE HE REMEMBERS WAS NEVER WRITTEN DOWN FOR THIS LETTER. What this comment used
     *  to say was "four weeks – the same thinking time the kit window's letters get", and that
     *  sentence was loose in a way that produced the bug: the KIT window is five weeks wide
     *  (`SPONSOR_WINDOW_WEEKS`, «межсезонье +2»), and what a kit letter actually gets is five weeks
     *  for the first of a winter down to two for the last, because its deadline is the WINDOW's and
     *  not its own (see `SPONSOR_LETTER_WEEKS`). Reading "the same thinking time" off
     *  `sponsorship.decideWeeks` – the number that SIZES that window rather than the time any letter
     *  gets – is how the advertising house came to give four. The owner's memory is the ruling
     *  (round 28 #2), so the campaign letter now gets the five weeks the window's own first letter
     *  gets, on its own clock, and the number is written here as a duration rather than borrowed.
     *
     *  ⚠ IT IS ITS OWN CLOCK AND MUST STAY ONE. An advertising letter is not windowed – it arrives
     *  on whatever week the campaign notices her (`reviewAdOffer`) – so it cannot inherit the kit
     *  window's «every letter dies when the window closes» rule without a decision hanging over
     *  weeks she is playing, which is the exact fault the 01.08 move into the off-season fixed.
     *  Stated on the paper and enforced by `expireOffers`. */
```
