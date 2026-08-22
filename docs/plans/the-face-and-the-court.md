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
- Bench + predicted-vs-measured: `docs/specs/ad-shoot-recovery-2026-08.md` (`npm run bench:adshoot`).
  The measured season: −9 condition on every deficit shoot week (the balanced rest week, forfeited),
  0 at the ceiling and on tournament collisions, 0 weeks lost, and an off-season landing impossible
  over 20,000 draws.

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
   construction – see §4a-1.*
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

⚠ **STEPS 1-2 ARE A COMPLETE FEATURE.** Everything from 3 on is the second axis, and that is a much
larger commitment – fame wants a surface, a fog rule and its own calibration.

⚠ **AND THE PAUSE UPSTREAM (22.08):** the private life – fame's feeder and half of §2's claim – is
paused by the owner until its own steps 1–2 exist. So steps 1–2 here are the only near-term
shippable chunk, and the stop after step 2 is not merely complete – it is currently the only honest
stopping place. Steps 3+ wait for `the-private-life.md` step 3 or later.
