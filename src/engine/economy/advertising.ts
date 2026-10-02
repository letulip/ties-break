// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/advertising.md#the-advertising-block

import type { AdTradeCategory } from '../../shared/protocol'
// ⚠ TYPE-ONLY: `../economy.ts` imports THIS module at runtime, so a value import back would close a cycle;
// `import type` is erased at compile time, which is why the shared shapes may live over there.
import type { AdBandDef, AdCategoryDef } from '../economy'

// THE ADVERTISING LADDER (round 24 item 2, docs/plans/the-face-and-the-court.md §6 STEPS 1-2;
// the three rungs are round 29 part two #19/#20) – THE OWNER: «Рекламные контракты будем
// добавлять какие-то?» – and the plan's answer is that the kit ladder above is complete and
// ENDEMIC (tennis brands paying for tennis), so what is missing is the other kind entirely: a
// non-endemic house paying cash for her FACE.
//
// ⚠ advertising: WHERE THE GATE SITS WAS THE PLAN'S OWN MEASUREMENT (§3, the owner's two careers)
// ⚠⚠ advertising: AND ROUND 29 PART TWO #20 IS THE OTHER HALF OF THAT ARGUMENT, WHICH NOBODY EVER BUILT.
// → docs/notes/economy/advertising.md#advertising
export const advertising = {
  /** ⭐⭐⭐ ROUND 41 #15 (12.09) – SIXTEEN, AND THE EIGHTEEN THAT STOOD HERE WAS OUR READING RATHER
   *  THAN HIS RULING. That is the whole of the item and it is written down first, because the
   *  paragraph below is the evidence against itself.
   *
   *  ⚠⚠ advertising.fromAgeYears: WHAT THE SHIPPED COMMENT SAID, KEPT VERBATIM BECAUSE IT IS THE EXHIBIT
   *  owner (advertising.fromAgeYears): «The age the owner scoped advertising mechanics to»…
   *  ⚠ Eighteen is already the engine's threshold age – `kidShare.fromAgeYears` above starts her own prize split there…
   *  owner (advertising.fromAgeYears), 12.09: «А рекламных контрактов правда не предлагают до 18 лет или это наше ноу-хау?»
   *  owner (advertising.fromAgeYears), 12.09: «реклама открывается с 16 (юниорские суммы, реже), а призовые падают на её счёт с первого»…
   *  ⚠ advertising.fromAgeYears: THE CLOCK IS UNCHANGED – her REAL age through `kidAgeAt`, never the band's, the one-clock ruling of 09.08.
   *  → docs/notes/economy/advertising.md#advertisingfromageyears
   */
  fromAgeYears: 16,
  /** ⭐⭐⭐ ROUND 41 #15 – THE JUNIOR BAND, and it is a BAND rather than four scattered multipliers
   *  on purpose: «юниорские суммы, реже» is one design sentence and it should be readable as one
   *  block. It governs exactly the real ages [16, 18); from her eighteenth birthday the shelf is
   *  byte-identical to what shipped, which is the property the bench arm is built to prove.
   *
   *  ⚠⚠ advertising.junior: TWO CATEGORIES AND NOT SIX, AND THE PAIR IS THE SHELF'S OWN CHEAPEST RUNGS RATHER THAN A TASTE.
   *  ⚠ advertising.junior: THE CAPSTONE AND THE LIFETIME LETTER ARE NOT ON THE LIST EITHER
   *  ⚠ advertising.junior: HALF THE CHEQUE AND HALF THE ARRIVALS
   *  ⚠⚠ advertising.junior: ONE YEAR, NEVER MORE, AND IT IS NOT A MULTIPLIER BUT A CEILING THE PAPER IS HELD TO.
   *  owner (advertising.junior): «в 18 лет предлагают подписать копеечные контракты на 2 и 3 года»
   *  ⚠ advertising.junior: The bands a sixteen-year-old can actually reach write one year anyway…
   *  → docs/notes/economy/advertising.md#advertisingjunior
   */
  junior: {
    /** the real age the junior band ENDS at – [16, 18), her own clock */
    untilAgeYears: 18,
    /** the only categories a letter may be written in before eighteen */
    categories: ['drinks', 'clothing'] as readonly AdTradeCategory[],
    /** the junior cheque as a share of the adult cell at the same band – «юниорские суммы» */
    feeBps: 5000,
    /** the junior arrival rate as a share of the adult chance – «реже» */
    chanceBps: 5000,
    /** every junior term, in years – a ceiling and not a draw */
    termYears: 1,
  },
  /** ⭐⭐⭐ ROUND 29 PART TWO #19/#20 – THE LADDER, WHICH IS WHAT THIS CATALOGUE DID NOT HAVE.
   *
   *  owner (advertising.bands): «я не увидел наш список спонсоров для съемок и прочего, не спортивных.»
   *  owner (advertising.bands): «предлагать контракт за 20к долларов на год для 100 и выше ракетки мира выглядит весьма сомнительно»…
   *  ⚠ advertising.bands: HE IS RIGHT, AND THE MEASUREMENT SAYS SO MORE SHARPLY THAN HE DID
   *  ⚠⚠ advertising.bands: THE DENOMINATOR MOVED UNDER THIS VERY WAVE AND THE FIRST SIZING WAS TAKEN AGAINST THE OLD ONE
   *  ⚠ advertising.bands: THE PER-SHOOT COLUMN IS THE CROSS-CHECK AND IT AGREES, WHICH IS WHY IT IS PRINTED.
   *  ⚠ advertising.bands: A CONSTANT SHARE IS A DECISION AND IT OVERRULES §3 OF THE PLAN, WHICH SAID THIS MECHANIC ONLY MATTERS EARLY.
   *  ⚠ advertising.bands: AND THE ENDEMIC LADDER STILL OUT-EARNS THE PHOTOGRAPH AT EVERY PROFESSIONAL RUNG
   *  ⚠⚠ advertising.bands: THE GATES ARE THE KIT LADDER'S OWN PROFESSIONAL CUTS, READ AND NOT SHARED.
   *  ⚠⚠ advertising.bands: THE SHOOT WEEKS ARE THE PLAN'S RECORDED LADDER, AND THEY ARE WHY IT STOPS AT THREE ROWS.
   *  ⚠⚠⚠ advertising.bands: ROUND 29 PART FOUR P6/§6–§8 SUPERSEDES THE THREE-ROW LADDER ABOVE, BY THE OWNER'S OWN CALIBRATION
   *  owner (advertising.bands): «Это доход у топ-100, у топ-50 точно больше»
   *  owner (advertising.bands): «одежда и обувь · часы · автомобили · гидратация и напитки»
   *  owner (advertising.bands): «Можно даже текущих использовать двойной программой»
   *  owner (advertising.bands): «на каждой ступени может быть до 4-6 одновременно, только с разными чеками»
   *  ⚠⚠ advertising.bands: THE GATES ARE THE KIT LADDER'S OWN PROFESSIONAL CUTS PLUS HIS OWN #100.
   *  ⚠ advertising.bands: THE SHOOT ASK RISES WITH THE BAND AND THE WINTER NOW CARRIES IT
   *  owner (advertising.bands): «слишком много съёмок и никакого отпуска»
   *  owner (advertising.bands), 03.09: «в 18 лет предлагают подписать копеечные контракты на 2 и 3 года … в фильме Финальный сет»…
   *  owner (advertising.bands): «129 место в мире, тот же контракт на 12к в год на 3 года.»
   *  owner (advertising.bands): «99 место в мире, тот же контракт на 20к в год на 2 года»
   *  ⚠⚠ advertising.bands: ABOVE THE TOP 100 NOTHING MOVED, ON HIS OWN EXPLICIT RULING
   *  owner (advertising.bands): «Про 50–100 отвечаю прямо: пересматривать не надо»
   *  ⚠ advertising.bands: 400 IS A NEW GATE AND IS NOT A KIT CUT
   *  owner (advertising.bands), 08.09: «в спорте я видел, что они и на 5, и на 10 лет заключают»
   *  ⚠ advertising.bands: The MEASURED defect this replaces: a flat 1–3 at every band…
   *  → docs/notes/economy/advertising.md#advertisingbands
   */
  bands: [
    { maxWtaRank: 400, shootWeeksPerYear: 1, termYearsMin: 1, termYearsMax: 1 },
    { maxWtaRank: 200, shootWeeksPerYear: 1, termYearsMin: 1, termYearsMax: 1 },
    { maxWtaRank: 100, shootWeeksPerYear: 1, termYearsMin: 1, termYearsMax: 2 },
    { maxWtaRank: 50, shootWeeksPerYear: 2, termYearsMin: 1, termYearsMax: 3 },
    { maxWtaRank: 10, shootWeeksPerYear: 2, termYearsMin: 2, termYearsMax: 5 },
  ] as readonly AdBandDef[],
  /** ⭐⭐⭐ THE PORTFOLIO'S CATEGORIES (P7, his own list mapped onto ours) – the shelf the player
   *  sees, one live deal per category, the cheque per band in each row.
   *
   *  ⚠ advertising.categories: ROUND 34 REWROTE THE TWO ROWS BELOW THE TOP 100
   *  ⚠⚠ advertising.categories: AND ROUND 34 #7/#11/#12/#13 (03.09) IS WHERE THAT ANCHOR FINALLY MOVES…
   *  owner (advertising.categories), 03.09: «в 18 лет предлагают подписать копеечные контракты на 2 и 3 года»
   *  owner (advertising.categories): «129 место в мире, тот же контракт на 12к в год на 3 года.»
   *  owner (advertising.categories): «99 место в мире, тот же контракт на 20к в год на 2 года»
   *  owner (advertising.categories): «Про 50–100 отвечаю прямо: пересматривать не надо»
   *  owner (advertising.categories): «может быть для нашего масштаба наша система нормальная, цифры только на первом тире и условия не»…
   *  ⚠ advertising.categories: A `null` CELL IS THE GATE
   *  ⚠⚠ advertising.categories: THE PER-CATEGORY LADDER IS NO LONGER MONOTONE AND THAT IS THE APPROVED TABLE, NOT A SLIP.
   *  ⚠ advertising.categories: It cost `adBandOfTerms` its old premise («the ladders are strictly increasing wherever they are not null»)…
   *  ⚠ advertising.categories: 2–4 HOUSES PER CATEGORY IS P6'S CHURN MADE VISIBLE
   *  owner (advertising.categories): «игрок устанет смотреть на одно и то же название без смены ГОДАМИ»
   *  ⚠ advertising.categories: CLOTHING HAS NO HOUSES OF ITS OWN, BY DESIGN («двойной программой»)
   *  → docs/notes/economy/advertising.md#advertisingcategories
   */
  categories: {
    // ⚠⚠ FIVE CELLS PER ROW SINCE ROUND 34, AND THE FIRST IS THE NEW ≤400 BAND. Read the columns
    // as ≤400 · ≤200 · ≤100 · ≤50 · ≤10; the last three are the round-29 catalogue untouched.
    watches: {
      label: 'Watches',
      trade: 'We make watches',
      houses: ['Quiet Hour', 'Halfpast', 'Silver Alder'],
      feeCentsByBand: [null, 200_000_00, 200_000_00, 500_000_00, 1_200_000_00],
    },
    cars: {
      label: 'Cars',
      trade: 'We make cars',
      houses: ['Northgate Motors', 'Caldera Auto', 'Faro Automobiles'],
      feeCentsByBand: [null, 120_000_00, 400_000_00, 800_000_00, 2_000_000_00],
    },
    drinks: {
      label: 'Drinks',
      trade: 'We make drinks',
      houses: ['Cold Current', 'Verdel Springs', 'Ninefold'],
      feeCentsByBand: [80_000_00, 80_000_00, 150_000_00, 400_000_00, 1_000_000_00],
    },
    // ⭐ THE ≤400 SHELF IS A KIT PATCH AND A DRINK AND NOTHING ELSE, which is exactly the film's
    // picture the owner brought: a patch on the shirt. Watches, cars, the airline and the
    // fragrance all stay shut down there.
    clothing: {
      label: 'Clothing',
      trade: 'We make her kit',
      houses: [],
      feeCentsByBand: [120_000_00, 50_000_00, 100_000_00, 300_000_00, 1_000_000_00],
    },
    airline: {
      label: 'Airline',
      trade: 'We fly people across the world',
      houses: ['Northmere Air', 'Corvess Airways', 'Palewing Atlantic'],
      feeCentsByBand: [null, null, 250_000_00, 600_000_00, 1_500_000_00],
    },
    fragrance: {
      label: 'Fragrance',
      trade: 'We make perfume',
      houses: ['Rivelle', 'Maison Ondelle', 'Blanche & Noir'],
      feeCentsByBand: [null, null, null, null, 2_500_000_00],
    },
  } as Record<AdTradeCategory, AdCategoryDef>,
  /** ⭐⭐⭐ THE CAPSTONE (P6, approved twice – §6 «D … очень хорошо» and §8's own last row): the one
   *  kit-shaped deal on top of the whole shelf. His anchor sentence, verbatim: «Федерер получал
   *  контракт с Nike на 10+ миллионов, это 1-2млн для родителя.»
   *
   *  ⚠⚠ advertising.capstone: THE GATE IS TENURE, NOT A RANK READ TODAY
   *  ⚠ advertising.capstone: KIT-SHAPED MEANS THE SHAPE, SAID PRECISELY
   *  → docs/notes/economy/advertising.md#advertisingcapstone
   */
  capstone: {
    /** seasons that must have ENDED inside the top 10 before the letter is written */
    seasonsInTop10: 4,
    /** the fee per contract year – his $10M sentence, exactly */
    cashCents: 10_000_000_00,
    termYears: 8,
    shootWeeksPerYear: 2,
  },
  /** ⚠ `termYearsMax: 3` STOOD HERE AND ROUND 39 #3 MOVED THE TERM ONTO THE BAND (owner 08.09,
   *  «давай так попробуем, как ты предложил»). Its note called 1–3 «the research's own law for
   *  non-endemic paper», and the flat law was the measured defect: at wta#5 and wta#91 alike the
   *  ladder wrote the same 1–3 draw, and NOTHING above three years existed in the game at all.
   *
   *  owner (advertising.lifetime): «А некоторые и пожизненно»
   *  ⚠⚠ advertising.lifetime: THE GATE IS THE CAPSTONE'S OWN TENURE READ PLUS THE ONE THING THE CAPSTONE NEVER ASKS
   *  ⚠ advertising.lifetime: THE FEE IS THE ICON BAND'S OWN BIGGEST TRADE CHEQUE, MADE PERMANENT
   *  ⚠ advertising.lifetime: ZERO SHOOT WEEKS, deliberately: shoot weeks are named at signature for the whole term…
   *  → docs/notes/economy/advertising.md#advertisinglifetime
   */
  lifetime: {
    /** ⭐⭐ THREE, NOT THE CAPSTONE'S FOUR, AND THE NUMBER IS MEASURED (owner, 08.09: «тогда окей и
     *  не вижу причин это не сделать»). His questions were «не будет ли это большим облегчением?
     *  сколько реально игроков в % … какая ценность будет?», and `tools/r39-tenure-reach.ts`
     *  answered them over the round-29 corpus shape – 9 presets x 2 policies x 6 seeds = 108
     *  careers, 900 weeks:
     *
     *  ⚠ advertising…seasonsInTop10: IDENTICAL - the two careers holding exactly three top-10 seasons hold ZERO slams…
     *  ⚠ advertising…seasonsInTop10: The capstone above stays at FOUR - it is tenure without a title…
     *  → docs/notes/economy/advertising.md#advertisinglifetimeseasonsintop10
     */
    seasonsInTop10: 3,
    /** Slam titles on the ledger before the house writes – the legend line */
    slamTitles: 1,
    /** per contract year, for ever – banked at signature and on every anniversary */
    cashCents: 2_500_000_00,
  },
  /** The earliest a shoot may land after the signature, in weeks – the studio is booked about a
   *  month out, and it is the same courtesy the letter's own decide weeks extend: a cost the
   *  player can SEE coming is a plan, a cost that lands the week he agreed to it is a trap. Engine
   *  mechanics of the choice, not a promise on the paper – so it is read at signature, not frozen
   *  into terms. */
  shootLeadWeeks: 4,
  /** ⭐⭐ ROUND 29 #3 – WHAT SHOOTING AND PLAYING IN THE SAME WEEK COSTS HER, PER DAY OF THAT WEEK.
   *
   *  owner (advertising.clashConditionPerDay): «+1 в день, т.к. съемка занимает не один час, то нагрузка будет мощной на всю неделю»
   *  ⚠ advertising.clashConditionPerDay: IT IS A PRICE AND NOT A REFUSAL.
   *  ⚠ advertising.clashConditionPerDay: PER DAY, MULTIPLIED BY THE WEEK'S DAYS AT THE ONE SITE THAT CHARGES IT (`accrueCondition`).
   *  owner 02.10 (advertising.clashConditionPerDay): «неделя съёмок… давай по 1 за каждый съемочный день, это может быть вполне справедливо»
   *  ⚠⚠ advertising.clashConditionPerDay: ROUND 45 #1b – THE DAYS ARE THE SHOOTING DAYS (THE ENTERED EVENT'S MATCH DAYS, `clashShootDays`), NOT THE WEEK'S SEVEN.
   *  → docs/notes/economy/advertising.md#advertisingclashconditionperday
   */
  clashConditionPerDay: 1,
  /** The weekly chance a qualifying week produces the letter, on its own sub-stream
   *  (`seed:ad:<week>`, never MAIN). 5% a week puts the median arrival ~13 weeks after she
   *  crosses the bar and the mean ~20 – the plan's §2 row «when it arrives: after results, and it
   *  LAGS them», bought with one number instead of a second calendar. Unlike the kit window's
   *  once-a-season 70%, this rolls weekly because a campaign is not an off-season ritual: brands
   *  write when they notice her. */
  offerChance: 0.05,
  /** HOW LONG THE PARENT HAS TO THINK, in weeks, counted INCLUSIVELY from the week the letter
   *  lands: the deadline is `arrival + decideWeeks - 1`, so five means the arrival week and the
   *  four after it, and the letter is still answerable on the last of them.
   *
   *  ⚠ advertising.decideWeeks: FOUR → FIVE, ROUND 28 #2, AND IT SETTLES A DISAGREEMENT RATHER THAN TUNING A NUMBER.
   *  owner (advertising.decideWeeks): «Предложение от спонсора с часами пришло на сорок четвёртой неделе А на сорок восьмой уже истёк»…
   *  ⚠⚠ advertising.decideWeeks: AND THE FIVE HE REMEMBERS WAS NEVER WRITTEN DOWN FOR THIS LETTER.
   *  ⚠ advertising.decideWeeks: IT IS ITS OWN CLOCK AND MUST STAY ONE.
   *  → docs/notes/economy/advertising.md#advertisingdecideweeks
   */
  decideWeeks: 5,
} as const
