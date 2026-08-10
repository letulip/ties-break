---
type: spec
status: draft
area: economy/academy
canonical: false
last-reviewed: 2026-08-10
---

# The academy is a ladder you buy into, and a place you can win

**Design proposal. Nothing built.** Second draft, 10.08, after the owner replaced the model in the
first one. The first draft had the academy scouting her and deciding whether to invite; his version is
better and simpler:

> «Шанс туда попасть у всех сословий одинаковый – оплатил и пошел. Другой вопрос, что не все могут
> себе это позволить… бывают бюджетные места в академиях (это для 8к применимо, особенно если хорошо
> играет)… может быть какие-то менее дорогие места для 25к, тогда подразумевается, что тренер будет
> включен в стоимость академии как и часть поездок. Академии, я уверен, тоже бывают разных уровней
> платности.»

**An academy is a business, not a talent scout.** You pay tuition and you go. What merit buys is not
admission – it is a funded place, and a funded place only changes anything for a family that could
not have paid.

## 0. The headline, and it is that the numbers were already right

`ECONOMY.academy.needFactor` reads `{ working: 1, middle: 0.6, wealthy: 0 }` and the round-ledger
audit could not decide whether round 5's «academy invitation as the wealthy-track money sink» was
done or open, because read as *who gets in* those numbers say the academy refuses the richest girl in
the game.

**They were never about who gets in. They are about what a funded place is WORTH to a family**, and
under that reading every one of them is correct and unchanged:

| background | `needFactor` | what it means now |
|---|---|---|
| working | **1** | a funded place is everything – without it she does not go |
| middle | **0.6** | a funded place is most of it – they could stretch, at a cost |
| wealthy | **0** | a funded place changes nothing – they were paying anyway |

Zero stops being "she is refused" and becomes **"she is admitted, and it costs them nothing they were
not already spending"**. Same constant, correct noun.

## 1. The model

### 1a. Academies are a price ladder, like coaches

Three or four rungs, priced per season. **The rung is the environment**, and the game already prices
environments: `coachFactor(tier, fit)` and `facilityRateCents(age, tier)` are a ladder from `self` to
`elite`, and the wealth corridor already says the same rung costs different money in different
markets.

⚠ **The fee is a BUNDLE, and that is the whole design** (the owner: *"тренер будет включен в
стоимость академии как и часть поездок"*). One season's fee replaces:

* the **weekly coach bill** – the academy's coaches are the academy's;
* the **court** – `facilityRateCents`, which since 08.08 follows the coach rung anyway;
* **part of the travel** – `travelCoverShare`, which is the one thing the academy already does today.

So an academy place is not a fourth bill beside three others. **It is the same three bills, bought as
a season instead of by the week, from one seller.**

### 1b. Which makes it a real decision, with a real shape

| | assemble it yourself | buy a place |
|---|---|---|
| **coach** | choose the person, change your mind any week | the academy's, and you do not pick |
| **court** | follows the rung you hired | included |
| **travel** | you pay | part of it included |
| **cost** | weekly, and you can stop | a season, committed up front |
| **what you buy** | control | reach – a rung you could not hire by the week |

**The trade has to be genuine or it is not a decision.** A place must be **dearer per unit** than
assembling the same rung yourself – you are paying for a bundle and for reach – while buying access
to a rung the weekly market does not sell you. If it comes out strictly cheaper it is a free upgrade;
if strictly dearer with nothing extra it is a tax. §4's ship rule pins both.

### 1c. A funded place is scarce, and that is how it is filtered

The owner: *«осталось только понять как это отфильтровать»*. **Not with a threshold. With scarcity.**

Each academy rung has **k funded places a season**, and they go to the best k applicants in the field
she is actually in – which the game can compute, because it has a living cohort with rankings and a
domestic table.

Why scarcity rather than a bar:

* **It is what a scholarship is.** You do not qualify for one, you win one.
* **It moves with the field.** The junior conveyor already brings a new generation in every season, so
  the same girl can win a place one year and lose it the next – and that is the game's own living-world
  property, not a new system.
* **A static rank bar has bitten this project before.** `ECONOMY.sponsorship` was gated at
  `world.kidRank <= 30`, fired for **nobody** across 120 seeds in any preset, and had to be rebuilt
  (30.07). A threshold is a number somebody guesses; a rank against the field is a measurement.

⚠ **And merit decides the place, never the price.** A wealthy girl can win a funded place – in life
she does, academies want the best players – and `needFactor: 0` means it changes nothing for her
family's money. The place is about her; the money it saves is about them. **That is the same rule the
first draft got right and the reason those constants survive.**

### 1d. What `reviewLevel` becomes

It stops being "does an academy want her" and becomes **"where does she rank among the applicants"**.
Its inputs are already exactly right for that and not one of them touches the family's money:

* `resultScore(rank)` – her results;
* `scoutScore(ceiling)` – her potential, through the scout's eye;
* `scoutWeight: 0.5` – half and half;
* `ageBand`, `minEventsPerYear` – she has to be the right age and actually be playing.

So the function survives; what changes is that its output is compared **against other applicants**
rather than against a bar.

## 2. What this does to the coach – and it is a collision worth naming

**If the academy provides the coach, the academy decides the training plan.** `docs/specs/training-dials.md`
has just made the week a thing the player fills in day by day, with a hired coach proposing and the
parent overriding. An academy place has to answer the same question, and the honest answer is the one
that makes it a trade:

**you get the academy's plan, and you may still override it** – exactly as with a hired coach – **but
you cannot choose the coach who writes it.** That is what "you do not pick" costs, and it is the
sharpest difference between the two routes.

⚠ **This must not become a second training system.** `coach-as-load-manager.md`'s standing rule: what
moves is who decides, never a new mechanic bolted beside the old one. An academy coach is a coach at
a rung, proposing through the same `setPlan`.

## 3. What it is not

* **Not a difficulty lever.** Admission is money, and money is the background – so the temptation is
  to let the academy sort the classes. The funded places are what stop it: merit is the only thing
  that moves a poor girl up this ladder, and it must move her all the way. If a measurement shows
  `working` careers never reaching a rung `wealthy` careers routinely buy, the funded count is wrong.
* **Not a fix for #90.** Making academy support **legible** is a separate open item and gets *harder*
  here: the bench reads only **$948 of `academy` income across four seasons** while 50 of 50 careers
  hold a scholarship, because it pays as a discount on travel and never as a line. A bundled fee makes
  the money leave visibly and what arrived still invisible.
* **Not the end of the weekly coach market.** Most careers will never buy a place. The Coach Market
  screen stays exactly what it is, with the academy as one more thing that can be true about a season.

## 4. The ship rule, authored before anything is built

`tools/two-cells.ts` is the instrument – background × coach, 50 careers, four seasons – and it grows
an academy arm per background.

1. **Admission must not sort by background.** The share of careers that could afford a rung, per
   background, must be explainable entirely by price. If a `working` career cannot reach a rung a
   `middle` one can *even when funded*, the funded places are not doing their job.
2. **A funded place must be winnable by a poor girl who plays well.** Measure it directly: of
   `working` careers in the top decile of the domestic table, what share hold a funded place? If it
   is not most of them, the scarcity is set wrong.
3. **The bundle must be a trade, not a tax.** Against the same seed assembling the same rung weekly:
   end funds within one season's fee, and a ranking difference nameable in one direction. **Strictly
   worse does not ship; strictly better is not a decision.**
4. **The scholarship arm must not move.** `working` and `middle` end funds, cameo share and ITF rank
   within noise of today. This is additive or it is wrong.
5. **RNG.** Buying a place is a player choice, so it may not change how many times MAIN is drawn.
   Invariant 2, and the same discipline the cameo already uses: draw unconditionally, let only the
   arithmetic depend on the answer.

## 5. Open, and the owner's to answer

1. **How many rungs, and does the top one exist for anybody?** Three is enough to be a ladder. A
   fourth that only a `wealthy` career ever reaches is defensible – the game already has an `elite`
   coach most careers never hire – but it should be chosen rather than fallen into.
2. **How many funded places per rung?** This is the one number the whole thing turns on and §4/2 is
   how it gets measured. My instinct is that the lowest rung has several and the top rung has one or
   none, because that is how it works – but it wants a sweep, not an instinct.
3. **~$55k was round 5's figure and it is not this game's scale.** A `middle` family's whole parent
   income is **~$22k a season**. So either the number belongs to a different economy, or the top rung
   is wealthy-only by arithmetic rather than by design. Both are fine answers; it should be a choice.
4. **Does a place have a term, and can it be lost?** A kit deal has a term and a review; the
   scholarship is re-decided every season by `reviewAcademy`. A funded place probably should be too,
   and losing one after a bad year is a real story – but it is a second review to write, and it is the
   difference between a relationship and a purchase.
