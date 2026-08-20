# The shop, the assets and the broker — backlog (owner, round 23 item 8, 19.08.2026)

This file records design intent, NOT a built feature. Fictional brands only. Player-facing copy uses
the short dash "–". Money is in CENTS in the engine.

Captured verbatim so the ask is not paraphrased away:

> «Может добавить какой-то "магазин" в игру? Инвестиции, элитная недвижимость, машины, яхты? Сделай
> отдельный файл в беклог пожалуйста с мыслями на этот счёт. Можно как раз на вкладку Family budget
> отдельным пунктом добавить как вариант. А ещё можно какую-то логику простенькую изменения цены на
> эти вещи добавить, кстати, чтобы что-то могло обесцениться, например, или стихийно взлететь в цене.
> Или вообще заморозиться на неопределенный срок. Плюс можно добавить "элитного брокера" с
> еженедельным костом, как тренера»

---

## 0. ⚠ What this has to be careful of, before any of the fun

**THE GAME IS ABOUT A PARENT SPENDING MONEY THEY DO NOT HAVE.** Every measured career so far is
negative for two seasons and only turns over around season 2–3 (round 23's own reading of
`alice-cfbv`: −$11k, −$9k, +$20k, +$47k, +$126k). A shop that arrives before the turn is a shop
nobody can open; a shop that arrives after it competes with the ONE decision the economy is built
around – whether to send the coach on the trip.

So the shop is not a money sink. **It is what money BECOMES once the tennis has stopped needing it**,
and its first job is to make late-career wealth mean something other than a bigger number on a card.

⚠ **AND IT MUST NOT BECOME THE OPTIMAL PLAY.** If assets out-return the tennis, the correct strategy
becomes "under-invest in her, buy property" – which inverts the entire premise. The design rule
below is therefore: **assets never beat a career, they only survive one.**

---

## 1. Where it lives

The owner's own placement, and it is right: **a fourth chapter on the Family budget tab**, beside
Spend / Bills / Ledger. Not a new screen – it is money, and money already has a home.

`MoneyScreen.vue`'s chapter picker is `SegmentedRow appearance="chapter"` since DRY-8, so a fourth
option is one row in `TAB_OPTIONS` and one `v-if` block. No new navigation.

---

## 2. What is on the shelves

Four families, deliberately different in what they DO rather than in price alone – a shop where the
only difference is cost is a list, not a decision.

| family | example | what it is FOR |
| --- | --- | --- |
| **investments** | index fund, bonds, a stake in a club | the boring one: small, steady, liquid |
| **property** | apartment, house, a place near the academy | slow, large, and can pay rent |
| **vehicles** | car, then the absurd ones | pure status, and it DEPRECIATES |
| **the absurd** | yacht, art, a horse | status with a running cost that hurts |

⚠ **AT LEAST ONE FAMILY MUST LOSE MONEY BY DESIGN.** Vehicles are the honest one: a car is a
*decision to spend*, dressed as an asset. If everything on the shelf appreciates, the shop is a
savings account with pictures.

⭐ **AND SOMETHING SHOULD BE ABOUT HER, NOT ABOUT WEALTH.** A place near the academy that cuts her
travel cost; a training court at home that changes a practice week. Those are the items that belong
in THIS game rather than in a generic tycoon – they turn money back into tennis, which is the loop
the rest of the app is made of.

---

## 3. Prices that move — the owner's own list, made mechanical

> «чтобы что-то могло обесцениться, например, или стихийно взлететь в цене. Или вообще заморозиться
> на неопределенный срок»

Three states, and the third is the interesting one:

- **DRIFT** – a small per-week move around a family's own trend. Property drifts up, vehicles drift
  down, investments drift up with more noise.
- **SHOCK** – rare, large, both directions. This is the "стихийно взлететь" case, and it is what
  makes an asset a story rather than a line item.
- **FROZEN** – ⭐ *the owner's sharpest idea in this item, and the one a normal shop never has*. The
  asset cannot be SOLD for an indefinite stretch – no buyer, a bad market, a legal hold. It is the
  only mechanic here that can genuinely hurt a player who did everything else right, and it is what
  stops "buy low, sell before the season" from being free.

⚠ **DETERMINISM, WHICH IS NOT NEGOTIABLE.** Every roll above goes through a purpose-scoped
sub-stream (`rngFromSeed(`${seed}:asset:${assetId}:${week}`)`) and NEVER the MAIN weekly stream. A
player's purchase must not move the world's dice – that is the input-independence law in `CLAUDE.md`
§2, and a shop is exactly the kind of feature that breaks it by accident.

⚠ **AND THE PRICE IS NOT A SECOND CURRENCY.** No new points, no separate wallet. Cents, one wallet,
`careerTotals` grows two fields at most.

---

## 4. The broker

> «можно добавить "элитного брокера" с еженедельным костом, как тренера»

Modelled on the coach, which is the right instinct – the app already knows how to hire someone by
the week, and the player already understands the shape.

What the broker BUYS, though, has to be information rather than return, or he becomes a money
printer:

- **without a broker**: prices are shown as they are today, and a shock arrives as a surprise.
- **with a broker**: he *names the band* – "this is above its trend", "this one has not moved in
  eleven weeks" – and he can warn that a freeze is likely before it lands.

⚠ **HE MUST NEVER PROMISE A NUMBER.** The moment he predicts a return the optimal play is "hire the
broker, follow him", and both the shop and his fee stop being decisions. He sells *legibility*, the
same thing the coach sells about her form.

Fee: the coach's own shape – a weekly cents cost, tiered, cancellable. Roughly the middle coach's
band, so the two compete for the same money and the player has to choose.

---

## 5. Sequencing, if it is ever built

1. **The tab with static prices.** Buy, own, sell. No movement at all. This alone tests whether the
   shop is fun, and it is one screen and one save field.
2. **Drift.** One sub-stream, no shocks. Watch a bench career for a season and see whether the
   numbers read as alive or as noise.
3. **Shock and freeze.** Only once drift is calibrated – a shock on top of an uncalibrated drift is
   untestable.
4. **The broker.** Last, because he is a UI over the three above and is worthless before them.

⚠ Each step is its own save-schema move (bump, append-only migration, golden fixture, e2e fixtures –
`CLAUDE.md` invariant 3), so the sequencing above is also four separate waves, not one.

---

## 6. The open questions the owner has to answer before step 1

1. **When does the tab appear?** Never before the money turns positive, or it is a shop with an
   empty shelf. Proposal: at her first professional season, or at a funds threshold.
2. **Can he sell HER things?** The racket, the academy place. Probably not – it makes the parent a
   liquidator of her career, which is a different game.
3. **Does the shop survive an ending?** A retirement card that names the house and the yacht is a
   good ending; one that silently drops them is a bug the player will feel.
4. **Is any of it inheritable by HER?** Round 23 item 18 asks for prize money to reach her account
   at 18. If she has money, does she have a shelf of her own? That is a much bigger game.

---

## 7. ⭐⭐ CHARITY – and the owner's instinct to have it both ways is right

He asked (19.08) whether giving should buy something back or be honestly disinterested, and then
answered better than the question: «попробовал бы в лучших традициях взять и объединить обе части».

**My view, and why the combination is not a compromise.**

⚠ THE TWO OPTIONS ARE NOT ACTUALLY OPPOSITES. "It gives something back" and "it is disinterested"
only conflict if the return is a PRICE LIST – donate X, receive Y. That version is not charity, it is
a shop with a halo, and it is strictly worse than the shop we already designed: the optimal play is
to give exactly as much as the reward is worth and not a cent more.

But a return that is **real, unpriced and unpromised** breaks nothing:

* she is invited somewhere because of who she has become, not because a counter filled;
* a sponsor whose values match turns up on his own – ⭐ note this one specifically converts giving
  into MONEY, which is the tycoon loop the shop otherwise owns;
* a line in the ending that names it, which costs nothing and is the whole point.

⭐ **SO THE COMBINATION IS: THE GIVING IS FREE, AND THE WORLD NOTICES.** No progress bar, no tier, no
"donate $50,000 to unlock". The player never knows in advance what a gift will do, which is the only
state in which the choice is genuinely his – and the game's own habit of not promising numbers (the
coach's room note, the broker in §4 above) is already this rule, applied elsewhere.

⚠ AND CHARITY IS THE ONLY MECHANIC IN THIS FILE THAT SPENDS MONEY WITH NO WAY BACK. Property can be
sold, investments grow, a car depreciates but is still a car. A gift is gone. That is what makes it
the one thing that can turn late-career wealth into a STATEMENT instead of a bigger number – and
round 23's measurement is why it matters: Ines earns $2.57M a year against $220k of costs, and her
INTEREST ALONE ($251k) exceeds every outgoing she has. The money has nowhere to go. That is the hole
this fills.

### The question that stays open for him

**Is it HER giving or the FAMILY's?** Round 23 #18 put her prize share in her own account from 18. If
the money is hers, the parent proposing a gift is a different scene entirely – and possibly a better
one than either half of the original question.
