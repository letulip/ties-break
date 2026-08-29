---
type: plan
status: draft
area: economy
canonical: false
last-reviewed: 2026-08-22
---

# Advertising contracts – what the sponsor ladder does NOT have (owner, round 24 item 2)

> «Рекламные контракты будем добавлять какие-то?»

⚠ **A PLAN, NOTHING BUILT.** And the first answer is that the ladder he already has is longer than it
looks, so the question is not "add sponsors" but "what kind is missing".

---

## 1. What exists today, measured

Five rungs, all gated on her table position, all with real terms:

| brand | gate | season | travel | retainer | other |
| --- | --- | ---: | ---: | ---: | --- |
| Netrally Distribution | local | $1,000 | – | – | kit only, a ceiling on what the shop spends |
| Play Beyond | – | $3,000 | – | – | |
| (third rung) | – | $5,000 | 25% | – | |
| Baseline Athletic | – | $5,000 | 25% | $1,500/qtr | result bonus 20% from W75 |
| **Meridian Sport** | WTA ≤ 50, 3 seasons | $8,000 | **50%** | $7,500/qtr | **appearance fee $15,000** at wta250+, bonus 25% |
| **Aurelia** | WTA ≤ 10, 4 seasons | $12,000 | – | – | the last contract decision a career makes |

⭐ **EVERY ONE OF THEM IS ENDEMIC** – a tennis brand paying for tennis, in kit, fares and result
bonuses. That is a complete and well-calibrated ladder of *equipment sponsorship*.

**What is missing is the other kind entirely.** «Рекламный контракт», in the ordinary sense, is a
NON-ENDEMIC brand – a watch, a bank, an airline, a cosmetics house – paying for her FACE. Nothing in
the game models that, and it is not a sixth rung of the same ladder.

---

## 2. Why it is a different mechanic, not a bigger number

| | the kit ladder (exists) | an advertising deal (missing) |
| --- | --- | --- |
| gated on | **ranking** | ⭐ **fame** – and they are not the same thing |
| what it buys | kit, fares, bonuses | cash, and a lot of it |
| what it costs her | nothing | ⚠ **TIME** – shoots, launches, appearances |
| when it arrives | with results | **after** results, and it LAGS them |
| when it leaves | when the rank goes | ⚠ much later – fame outlives form |
| can she refuse it | not meaningfully | ⭐ **yes, and that is the interesting part** |

⭐⭐ **THE TIME COST IS THE WHOLE DESIGN.** A sponsor cheque that costs nothing is a number going up –
the failure mode this project has already named twice (the academy nobody noticed; a staff that pays
for itself). A shoot that eats the week before a tournament is a DECISION, and it is the same decision
the coach's travel already models so well: money against preparation.

⚠ **AND FAME IS NOT RANKING**, which is what makes this worth building rather than re-skinning. A
photogenic #40 with a story can out-earn a dour #8 – that is true in the sport and it gives the game a
second axis it does not currently have. It would also connect three loose items: the private life
(`the-private-life.md`) generates the story; the shop (`the-shop-and-the-broker.md`) is where the
money goes; and the psychologist has something new to be needed for.

---

## 3. ⚠ The measurement that says WHEN this can exist at all

From round 23's reading of the owner's own two careers:

| | Alice, 18 | Ines, 24 |
| --- | ---: | ---: |
| prize money | $112,927 | **$2,566,200** |
| interest alone | $3,235 | **$251,439** |
| all outgoings | $64,000 | $220,000 |

⚠⚠ **AT INES' LEVEL AN ADVERTISING DEAL IS NOISE.** Her interest already exceeds every cost she has.
Any cheque we add there changes nothing a player can feel.

⭐ **SO THE ITEM ONLY MATTERS EARLY** – a local ad at Alice's stage is real money against a real
budget. Which inverts the natural instinct to gate it on the top ten: **the deals worth building are
the small ones, and they belong where the game is still tight.**

---

## 4. A shape, if it is built

1. **One deal at a time**, offered rather than browsed – the offer letter surface already exists.
2. **Gated on a fame reading**, not on rank. Fame is slow: it rises with results and with the private
   life, and it falls much more slowly than a ranking does.
3. **The cost is weeks, not money.** A deal names how many appearance weeks it wants in the season and
   when. Those weeks are unavailable for tournaments or rest – priced exactly like a trip.
4. **Refusable, with a reason.** ⭐ A brand she does not want is the first time the player is asked
   what kind of person he is raising, and the game has nowhere else that asks that.
5. ⚠ **No progress bar and no tier list.** Same rule the charity section of the shop file already
   argues: an unpromised return is the only kind that leaves the choice with the player.

## 4a. ⭐⭐ THE COST, NAMED BY THE OWNER – it is the WEEK'S RECOVERY, not the week

> «наверное в зависимости от всяких съемок и прочего может меняться восстанавливающий эффект недели»

⭐ **THIS IS BETTER THAN THE VERSION ABOVE AND IT SHOULD REPLACE IT.** §4.3 proposed that a deal books
appearance WEEKS, which needs a second calendar of its own and collides with entries, blackouts and
vacations. His version needs none of that: the week stays hers, and what changes is **how much of it
she gets back**.

The channel already exists and is already legible. `ECONOMY.physio.conditionBonusPerWeek`, the rest
bonus a skipped tournament pays, the vacation packages that buy a deep reset – **recovery is a number
this game already moves for good reasons, and the player already reads it.** A shoot week that
recovers like a travel week rather than a rest week is a real cost, stated in a currency he knows.

⚠ **AND IT SCALES THE RIGHT WAY.** A small local deal costs a little recovery; a campaign costs a
lot. No new state, no second calendar, no new surface – one modifier on an existing weekly figure.

### 4a-1. ⭐ SHIPPED AS STEP 2 (22.08), and the ladder above it is RECORDED, not built

The owner read step 1's letter line «no appearances scheduled» and ruled it dead: «съемки должны
быть иногда и это надо как-то прописывать и отражать потом в свободных неделях, соответственно и
восстановления на тех неделях должно быть чуть меньше». The sized version he approved («утверждаю,
для начала точно ок»):

- **Quiet Hour ($20,000 / 12 months): exactly 2 shoot weeks per term**, IN-SEASON – §5.2's own
  answer, an off-season cost is free money wearing a cost's clothes – **named in the letter at the
  signature** (drawn on `seed:ad:shoots:<week>`, spaced, never adjacent, never before a 4-week
  lead), marked on the calendar look-ahead, and each recovering **like a travel week rather than a
  rest week** (`accrueCondition` + the `withheldFreeWeekRecovery` refunds). A tournament on a shoot
  week is not blocked and not double-charged – she simply recovers worse. A shoot the college
  freeze swallows lapses silently (§4c's law applied to weeks as well as money).
- ⚠ **THE LADDER, RECORDED ONLY – nothing below this line is built**: bigger campaigns would carry
  3-4 shoot weeks, a global house 5-6, and the sum of live deals must never exceed **6 shoot weeks
  a year**. When a second house ever arrives, it takes these numbers from here, not from a guess.
  ⭐⭐ **BUILT, 29.08 (round 29 part two #19/#20), and it did take these numbers from here.** The
  catalogue is `ECONOMY.advertising.houses`: **Quiet Hour** (a watchmaker, WTA ≤ 200, $20,000,
  2 shoots) – *unchanged to the cent* – **Northmere Air** (an airline, WTA ≤ 50, $40,000, 4 shoots)
  and **Rivelle** (a cosmetics house, WTA ≤ 10, $55,000, 6 shoots). The top of each recorded band,
  so the annual cap is **structural rather than a rule**: one deal at a time plus a one-year term
  means the most she can ever owe in a year is the biggest single house's six, and a fourth rung
  would have nothing left to ask for.
- Bench + predicted-vs-measured: `docs/specs/ad-shoot-recovery-2026-08.md` (`npm run bench:adshoot`).
  The measured season: −9 condition on every deficit shoot week (the balanced rest week, forfeited),
  0 at the ceiling and on tournament collisions, 0 weeks lost, and an off-season landing impossible
  over 20,000 draws.
- ⚠⚠ **SUPERSEDED TWICE, 29.08 (round 29 part four P6/§8 and P9), BY THE OWNER.** The three-house
  ladder above became the **category portfolio** – one live deal per category (watches, cars,
  drinks, the kit brand's own campaign, airline, fragrance, and the tenure-gated capstone), §8's
  four bands (200/100/50/10) with the cheque as the only scaling axis, 1–3-year churned terms paid
  per contract year – `ECONOMY.advertising.categories`/`bands`/`capstone`, and the one-deal-at-a-time
  rule of §4.1 is now PER CATEGORY (`adSpokenFor`, re-aimed, never deleted). And P9 overturned the
  in-season-only rule below: «межсезонье… у нас 6 пустых недель там» – **the winter is the shoot
  season now** (`isWinterShootWeek`, `chooseShootWeeks` fills it first), its cost is the DISPLACED
  REST the empty week would have banked, and only the overflow spills in-season where the round-29
  #3 clash machinery prices it exactly as this section records. The «6 shoot weeks a year is
  structural» sentence is therefore retired with the one-deal rule that carried it: the shoot budget
  is now the portfolio's own arithmetic (per-deal-per-year asks × filled categories), and the winter
  carries the bulk of it.

## 4b. What else these contracts can carry, from eighteen on

He asked for the additional mechanics («какие у нас могут быть механики этих контрактов
дополнительные от 18+ лет начиная и дальше»). Candidates, cheapest first:

1. **Her own money.** Round 23 #18 already routes a share of prize money to `kidFundsCents` from
   eighteen. ⭐ An advertising deal is HERS by nature – a brand buys her face, not the family's – so
   this is the first income the parent genuinely does not control, and it needs no new machinery.
   *(22.08: the rail is live in the tree since schema v54 – a fact now, not a prediction.)*
2. **The refusal, and its reason.** A brand she will not be seen with. ⚠ This only works if declining
   is sometimes RIGHT – see §5.3.
3. **Obligations that outlive form.** A three-season deal signed at a peak still owes its shoots two
   seasons later at #90. Fame lags results in both directions, and this is where that bites.
4. **A conflict with the kit ladder.** Two brands in the same category cannot both have her. ⚠ A real
   constraint that costs nothing to model: signing one closes a door on the other.
5. **The private life feeding it.** `the-private-life.md` is where the story comes from; a marriage,
   a public relationship or a loss all move fame, in both directions.

---

## 4c. ⚠ The freeze: nobody writes to an amateur (round 24)

At college the sponsor settle is gated off inside the freeze, and an advertising deal follows the
same law – no offers arrive while she is enrolled. ⚠ Which raises the question §5 now carries: a
deal SIGNED before the fork whose term crosses it. The honest candidates are a pause (the
obligations wait for her return) or a lapse (the brand walks, no penalty – «мы ни за что не
наказываем» applies to contracts too); a scripted punishment is out. Owner's call, needed before
step 6 ships.

---

## 5. Open for him

1. **Is fame a number we are willing to own?** It is a second reputation axis and it will want a
   surface, a fog rule, and its own calibration.
2. **Do the appearance weeks come out of the season, or out of the off-season?** The first is a real
   cost; the second is free money wearing a cost's clothes. ⭐ *Answered 22.08: in-season, by
   construction – see §4a-1.* ⚠⚠ *Re-answered 29.08 by the owner (round 29 part four P9), the other
   way: the winter IS the shoot season – Zheng's «слишком много съёмок и никакого отпуска» is the
   model – and the off-season cost is real after all: it is the displaced rest of the empty week
   (`accrueCondition` already prices a shoot week at the travel figure, so parking one on a winter
   week forfeits exactly the recovery the vacation would have banked).*
3. **Should refusing ever be right?** If declining is always wrong, it is not a decision. If it is
   sometimes right, the game has to say why – and that is a moral statement, not a balance one.
4. **What happens to a live deal when she enrols?** Pause or lapse – see §4c.

---

## 6. Steps

⚠ Each needs a save-schema move. And ⚠ §3's measurement decides where this is worth building at all:
**early, where the budget is still tight** – not at the top, where an ad cheque is noise.

| # | step | done when |
| --- | --- | --- |
| **1** | ⭐ **SHIPPED 22.08** – **one non-endemic offer**, gated on results only, cash only | it arrives, it can be signed, and the ledger shows it – `tests/ad-offer.test.ts` walks all three |
| **2** | ⭐ **SHIPPED 22.08** – **the recovery cost** (§4a-1): 2 shoot weeks per term, letter-named, calendar-marked, travel-week recovery | the bench bar is met: `ad-shoot-recovery-2026-08.md` shows −9 per deficit shoot week and **0 weeks lost** |
| **3** | **fame** – a slow second axis that rises with results and falls slower than a ranking | a photogenic #40 can out-earn a dour #8 in a bench, which is the whole claim |
| **4** | **refusal with a reason** (§4b.2) | declining is sometimes the better play, and the game can say why |
| **5** | **her own account** (§4b.1) – the deal pays HER, not the family | the parent can see money he cannot spend |
| **6** | **obligations that outlive form** (§4b.3) | a deal signed at a peak still owes its weeks at #90 |

⚠ **THE LETTER'S SHELF LIFE IS FIVE WEEKS, NOT FOUR (round 28 #2, 28.08).** Step 1 shipped with
`ECONOMY.advertising.decideWeeks: 4`, counted inclusively – a letter filed on W44 died on W47. The
owner: «Предложение от спонсора с часами пришло на сорок четвёртой неделе А на сорок восьмой уже
истёк срок рассмотрения мне казалось мы договаривались про 5 недель», and his memory is the ruling.
**The five was never written down for this letter and that is where the bug came from**: the
constant's comment said "the same thinking time the kit window's letters get", but the kit window is
five weeks wide and its letters carry five down to two because their deadline belongs to the WINDOW
(`docs/specs/sponsor-window-2026-08.md` §3.1) – reading "the same" off `sponsorship.decideWeeks`, the
number that *sizes* that window, produced four. The two clocks stay separate: an ad letter arrives on
whatever week a campaign notices her, so it cannot inherit «every letter dies when the window closes»
without leaving a decision open while she is playing. Pinned as a literal in `tests/ad-offer.test.ts`,
measured from four different arrival weeks so a shared deadline cannot creep back in.

⭐⭐ **AND §3'S CONCLUSION IS OVERTURNED BY ROUND 29 PART TWO #20 – read this before quoting it.**

The owner, on the shipped rung: *«предлагать контракт за 20к долларов на год для 100 и выше ракетки
мира выглядит весьма сомнительно, как мне кажется, поправь меня, если я ошибаюсь пожалуйста.»*
He is right, and `docs/research/off-court-money.md` is the sourced answer.

§3 said the deal only matters EARLY and therefore should be gated low and left to decay – and it
drew that conclusion honestly from a catalogue with one row, where a fixed cheque genuinely does
decay into noise. What it never considered is a rung sized on the stage it opens for, which does not.
So the half of §3 that stands is the measurement (*at Ines' level a $20,000 cheque is noise*) and the
half that falls is the design it implied (*so gate it low and accept that*). What the shipped code
had was worse than either: a floor at WTA #200 and **no ceiling at all**, so the world #21 in his own
save was offered exactly what the #199 is.

⭐ **The number was never the defect.** Measured across 108 careers, $20,000 is 19.9% of the median
annual outgoings of a season spent in the WTA 51–200 band (pre-wave; 23.1% after it) – and the line is crossed at almost exactly
the rank he named: 24–25% of a season's costs from #100 to #200, 13% inside the top 100. The ladder
holds **the bottom rung's own share of the stage's outgoings** at every rung, and `houses.watch` is unchanged.

⚠ **STEPS 1-2 ARE A COMPLETE FEATURE.** Everything from 3 on is the second axis, and that is a much
larger commitment – fame wants a surface, a fog rule and its own calibration. ⭐ The ladder above is
NOT step 3: it is more rows of steps 1–2, gated on results exactly as they are. Fame is still unbuilt
and still waits on the private life.

⚠ **AND THE PAUSE UPSTREAM (22.08):** the private life – fame's feeder and half of §2's claim – is
paused by the owner until its own steps 1–2 exist. So steps 1–2 here are the only near-term
shippable chunk, and the stop after step 2 is not merely complete – it is currently the only honest
stopping place. Steps 3+ wait for `the-private-life.md` step 3 or later.
