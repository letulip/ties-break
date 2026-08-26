---
type: spec
status: draft
area: economy
canonical: false
last-reviewed: 2026-08-26
---

# The shop, the assets and the broker – the buildable spec

The owner, 26.08.2026, on being told the tab's opening moment was an open question blocking step 1:

> «что значит ждет "когда открывается вкладка"? Надо расписать спеку по всем идеям и можно запускать
> будет после утверждения. Вкладка новая в Бюджете возле Bills/Expences. Можно не всё сразу делать, а
> с какой-то части более менее понятной начать, например»

⚠ **THIS FILE IS THE BUILDABLE HALF.** The argument, the owner's verbatim asks and the reasoning
behind every choice live in [the-shop-and-the-broker.md](../backlog/the-shop-and-the-broker.md) and
are NOT repeated here – a spec that restates its plan is a fork that rots. This is shapes, numbers,
guards and acceptance.

---

## 1. Placement – settled by him, no design left

**A fourth chapter on the Budget tab, beside Spend / Bills / Ledger.** `MoneyScreen.vue`'s chapter
picker has been `SegmentedRow appearance="chapter"` since DRY-8, so this is one row in `TAB_OPTIONS`
and one `v-if` block. **No new navigation, no new tab in the bottom bar.**

### 1a. ⚙ When it appears – MY ANSWER, since he ruled the question should not block

**Always visible from the first week of the professional era; never in the junior years.**

The backlog's §0 warning – «a shop that arrives before the turn is a shop nobody can open» – is about
being USABLE, not about being VISIBLE, and those are different things. A hidden tab teaches nothing
and arrives one day as a surprise; a visible one with prices on it is the motivation the economy
already wants, and a shop window is a thing you look into before you can afford it.

⚠ **What that costs is honesty on an empty shelf.** Round 23 measured the money turning positive at
season 2–3 (`alice-cfbv`: −$11k, −$9k, +$20k, +$47k, +$126k), so for the first season or two the tab
is a window. The screen therefore says what it is – a plain line naming the cheapest thing she could
reach and what it costs – and never a locked row, a progress bar or a teaser. **If he prefers the tab
to appear at the first positive season instead, that is one predicate and this spec does not
otherwise change.**

---

## 2. Slice 1 – the part that is «более менее понятная»

**The tab, four items, static prices, buy / own / sell. No movement of any kind.** This is the slice
that answers the only question worth asking first: is spending money on things fun in THIS game?

### 2a. The shelf, and why these four

One per family, so slice 1 already proves the families behave differently:

| item | family | price | behaviour in slice 1 | why it is first |
| --- | --- | --- | --- | --- |
| **A court at home** | about her | $45,000 | holds its value | ⭐ turns money back into tennis – the loop the rest of the app is made of |
| **A flat near the academy** | property | $180,000 | holds its value | the honest big-ticket item, and it is about her travel |
| **The car** | vehicles | $60,000 | **loses 8%/season, from week one** | ⚠ the shelf MUST contain something that loses money by design, or the shop is a savings account with pictures |
| **An index fund** | investments | any amount, $5,000 min | **gains 4%/season** | the boring one, and it is the control the other three are read against |

⚠ **THE TWO «ABOUT HER» ITEMS DO NOTHING MECHANICAL IN SLICE 1.** The court does not change a
practice week and the flat does not cut travel yet – they are bought, owned and sold like the rest.
Giving them effects belongs to slice 2 at the earliest, because an item that changes the tennis has
to be measured against the tennis, and slice 1 has no measurement rig for that. ⭐ Their names are
still right today: what a thing IS should be true from the first version even when what it DOES
arrives later.

### 2b. The data

```
OwnedAsset = { id: AssetId; boughtWeek: number; paidCents: number; valueCents: number }
WorldState.assets: OwnedAsset[]        // empty on every existing career
```

- **Cents, one wallet.** No second currency, no points. Buying is an `expense` ledger row, selling an
  `income` one, both through the same till every other cost uses.
- **`valueCents` is stored, not derived.** A derived value would have to be recomputed identically by
  the screen and the ledger, and this repo has been bitten twice by two sides asking different
  functions about one question. One number, written by the tick.
- **The catalogue is a constant, not save data** – `ECONOMY.shop.catalogue`. Only what she OWNS is
  persisted, so adding an item later is not a migration.

⚠ **SAVE SCHEMA: one move, the full four parts** – bump, append-only migration writing `assets: []`,
golden fixture, `npm run e2e:fixtures`.

### 2c. RNG – zero draws in slice 1, and the law for every slice after

⚠⚠ **INPUT-INDEPENDENCE IS NOT NEGOTIABLE (`CLAUDE.md` §2).** Slice 1 has no randomness at all: the
two rates above are arithmetic on `boughtWeek`. From slice 2 every roll goes through a purpose-scoped
sub-stream – `rngFromSeed(\`${seed}:asset:${assetId}:${week}\`)` – and **never** the MAIN weekly
stream. A player's purchase may not move the world's dice. The frozen MAIN capture (41550 /
`e6b0c709`) must be unmoved by every slice in this file; if it moves, the sub-stream leaked.

### 2d. The guard class

A shop command is about the FAMILY'S OWN money, so it belongs to `guardNotEndedForGood` – the short
list round 24 created that already holds the vacation cancel and the birthday gift – and **not** to
the tour-command guard that refuses inside the college freeze. ⭐ That is what makes the college years
shoppable, which §0a of the backlog argues is the shop's best moment.

### 2e. Acceptance for slice 1

1. A bench career buys the car in season 3, sells it two seasons later, and the ledger shows the loss
   to the cent – **the loss is the feature**.
2. `careerTotals` grows at most two fields (spent on assets, realised on sales); nothing else moves.
3. **The frozen MAIN capture is unmoved.**
4. A v-previous save loads with `assets: []` and plays identically – golden fixture proves it.
5. ⚠ **The money still goes somewhere else first.** On a bench career under the standard policy, the
   shop may not become the dominant outgoing before season 4 – if it does, it is competing with the
   coach and the tennis, which is the one thing §0 says it must not do early.

---

## 3. Slice 2 – drift

Every family gets a per-week trend, one sub-stream, no shocks.

| family | trend | noise |
| --- | --- | --- |
| property | up, slow | low |
| investments | up | ⭐ the highest – it is the boring one only in outcome, not week to week |
| vehicles | **down** | low |
| about her | flat | none – these are not investments and should not read as one |

**Done when** a season of prices reads as alive rather than as noise, measured on a bench career: a
player can tell the four families apart from the numbers alone, without being told which is which.

---

## 4. Slice 3 – shock and freeze

- **SHOCK** – rare, large, both directions. What makes an asset a story rather than a line item.
- **FROZEN** – ⭐ the sharpest idea in his original ask and the one a normal shop never has: the asset
  **cannot be sold** for an indefinite stretch. No buyer, a bad market, a hold. It is the only
  mechanic here that can hurt a player who did everything right, and it is what stops «buy low, sell
  before the season» from being free.

⚠ **A FREEZE MUST BE SURVIVABLE.** It may never be the reason a family goes bankrupt: the bankruptcy
door reads liquid funds, and an asset that cannot be sold is not liquid. Acceptance: over a career
sweep, **zero bankruptcies whose proximate cause is a frozen asset**. If one appears, the freeze
needs a floor – a forced sale at a bad price is a story; a career ended by a UI state is a bug.

⚠ Shocks only once drift is calibrated. A shock on top of an uncalibrated drift is untestable.

---

## 5. Slice 4 – the broker

Modelled on the coach: a weekly cents fee, tiered, cancellable, roughly the middle coach's band **so
the two compete for the same money**.

**What he sells is LEGIBILITY, never return.**

- without him: prices are what they are, and a shock is a surprise;
- with him: he names the BAND – «this is above its trend», «this one has not moved in eleven weeks» –
  and can warn a freeze is likely before it lands.

⚠⚠ **HE MAY NEVER PROMISE A NUMBER.** The moment he predicts a return, the optimal play is «hire him,
follow him» and both the shop and his fee stop being decisions. This is the same rule the coach's
room note already lives under. **Acceptance: a career following every broker line may not
out-earn one ignoring him by more than his own fee** – if it does, he is a money printer.

---

## 6. Slice 5 – charity

**The giving is free, and the world notices.** No progress bar, no tier, no «donate $50,000 to
unlock». The player never knows in advance what a gift will do, which is the only state in which the
choice is genuinely his.

What may come back – unpriced, unpromised, never a counter:

- an invitation somewhere, because of who she has become;
- a sponsor whose values match turning up on his own (⭐ this one converts giving into MONEY, closing
  the loop the shop otherwise owns);
- a line in the ending that names it.

⚠ **CHARITY IS THE ONLY MECHANIC HERE THAT SPENDS WITH NO WAY BACK**, and that is what makes it the
one thing that turns late-career wealth into a statement rather than a bigger number. Round 23's
measurement is why it matters: Ines earns $2.57M a year against $220k of costs, and her INTEREST
ALONE ($251k) exceeds every outgoing she has. The money has nowhere to go.

---

## 7. What is still his

1. **§1a** – tab visible from the pro era (my answer), or only from the first positive season?
2. **Can he sell HER things?** The racket, the academy place. My answer is no: it makes the parent a
   liquidator of her career, which is a different game. Recorded as a proposal, not a decision.
3. **Does the shop survive an ending?** My answer is yes and it is cheap: the retirement card names
   what the family owns. An ending that silently drops the house is a bug the player will feel.
4. **Does SHE get a shelf?** `kidFundsCents` is live (v54, `state.ts:251`) and round 26 #5 proved the
   share arrives – 5,593 cheques audited, 4,737 of them after eighteen, none missed. So the plumbing
   no longer blocks it. It is a much bigger game and I would not open it inside this spec.

---

## 8. Steps

⚠ Each slice is its own save-schema move and its own wave – four separate PRs, not one.

| # | slice | done when | state |
| --- | --- | --- | --- |
| **1** | the tab, four items, static prices (§2) | §2e's five acceptance numbers | **Ready – awaits his approval** |
| **2** | drift (§3) | the four families are distinguishable from the numbers alone | Next |
| **3** | shock and freeze (§4) | zero bankruptcies caused by a freeze, over a sweep | Next |
| **4** | the broker (§5) | following him beats ignoring him by less than his fee | Later |
| **5** | charity (§6) | a gift changes something unpromised, and the ending can name it | Later |
