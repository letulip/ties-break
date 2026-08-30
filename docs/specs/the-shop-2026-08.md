---
type: spec
status: draft
area: economy
canonical: false
last-reviewed: 2026-08-29
---

# The shop, the assets and the broker – the buildable spec

⚠ **REWRITTEN 26.08 on his review of the first draft.** Six of his corrections changed the shape of
the thing, and one of them corrected a mistake I should not have made: **this is the PARENT's money.**
His words, and they are a reminder rather than a new instruction:

> «Мы же делаем инвестиции для родителя, ты помнишь? А не для нее, её можно всё тот же % дохода от
> инвестиций перечислять, в принципе.»

The argument, his verbatim asks and the reasoning live in
[the-shop-and-the-broker.md](../backlog/the-shop-and-the-broker.md). This file is shapes, numbers,
guards and acceptance.

---

## 1. Whose money, and what that rules out

**The shelf belongs to the parent.** The player has spent a whole career paying for someone else's
tennis; this is the first screen in the game where the money is his to enjoy. That single fact
settles three things the first draft got wrong or left open:

- ⚠ **Nothing on the shelf is bought FOR her.** «A court at home» and «a flat near the academy» are
  struck – see §3d and §3e for what replaces them.
- **She is not a shopper.** `kidFundsCents` exists (v54) and round 26 #5 proved her share arrives on
  every cheque, but a second shelf for her is a different game and this spec does not open it.
- **What she CAN get is a cut of the returns** – his own suggestion, §7.

---

## 2. Placement – settled by him, no design left

**A fourth chapter on the Budget tab, beside Spend / Bills / Ledger.** `MoneyScreen.vue`'s chapter
picker has been `SegmentedRow appearance="chapter"` since DRY-8: one row in `TAB_OPTIONS`, one `v-if`
block. No new navigation, no new bottom-bar tab.

**Visible from the first week of the professional era, never in the junior years.** The backlog's §0
warning – «a shop that arrives before the turn is a shop nobody can open» – is about being USABLE,
not about being VISIBLE. A shop window is a thing you look into before you can afford it. On an empty
shelf the screen says so plainly, naming the cheapest reachable thing and its price: never a locked
row, a progress bar or a teaser.

---

## 3. The shelf

Six families. Each must behave differently – a shop where the only difference is price is a list, not
a decision.

### 3a. Investments – the core, and he asked for it to go further

> «"индексный фонд" вообще интересно звучит, надо развить идею дальше»

Not one product but a small ladder, and the axis is **liquidity against return** rather than return
alone:

| product | minimum | expected | ⚠ the catch |
| --- | --- | --- | --- |
| **deposit** | $1,000 | ~2%/yr | none – the floor, and the thing a cautious player can always do |
| **index fund** | $5,000 | ~7%/yr, noisy | can be DOWN for a whole season and still be the right holding |
| **bonds** | $25,000 | ~4%/yr | **locked for N seasons** – the first taste of the freeze mechanic, but honest and stated up front |
| **a stake in a club** | $250,000 | ~5%/yr + ⭐ | pays a return AND gives her a home venue (§10.1) – the family's money buying her tennis |

⭐ **THE RETURN IS PAID WEEKLY INTO THE LEDGER, not accrued invisibly.** A line every week is the
whole difference between owning something and having a number go up: the player should see the
deposit's $19 beside the coach's $600 and feel the gap.

⚠ **AND THE INDEX FUND MUST BE ABLE TO LOSE.** A product that only rises is a savings account with a
better name. Its season may be negative; only its multi-season trend is up.

### 3b. Cars – a ladder, and the dear ones fall hardest

> «Машина вполне может быть и не одна, а еще более дорогие варианты, которые будут больше терять в цене»

⚙ **26.08 – the gap narrowed on his word: «давай гэп сделаем скромнее пока что от 60 до 300к».**

| car | price | loses |
| --- | --- | --- |
| the sensible one | $60,000 | 6% a season |
| the good one | $110,000 | 9% a season |
| the one he wanted at nineteen | $190,000 | 12% a season |
| the unreasonable one | $300,000 | 15% a season |

⭐ **A five-fold spread rather than the twenty-two-fold one I first drew, and he is right to pull it
in.** A $900k car sits in a different economy from the family this game is about – it would be
reachable only by the handful of careers that break the top ten, so three of the four rungs would be
decoration for everyone else. From $60k to $300k every rung is a real decision for a real career, and
the ladder can always be extended upward later. Widening a ladder is cheap; a ladder nobody can climb
teaches nothing.

⚠ **THIS FAMILY EXISTS TO LOSE MONEY AND THAT IS THE POINT.** If everything on the shelf
appreciates, the shop is a savings account with pictures. A car is a decision to SPEND, dressed as an
asset, and the ladder makes the dressing thinner the higher you climb.

### 3c. Houses – tiers, for the family

> «здесь надо разные тиры домов делать»

The family home, in three or four bands from «finally not renting» to the absurd. Slow, large, and
the only family that can pay RENT if it is not lived in. ⭐ The first rung matters most: the earliest
seasons are measured in debt, and a family that finally owns where it lives is a real milestone this
game currently has no way to mark.

### 3d. ⚠ «A court at home» – struck from the shelf, and it becomes a GIFT

He caught the confusion: «что значит "дома"? у нас уже было где-то в подарках, что она себе свое
жилье покупала (первый взнос или вроде того), тогда наверное актуально там корт делать ей в подарок
типа».

**He is right and the precedent is already in the code.** `world/birthday.ts:469` offers **«A deposit
towards her own place»**, and `:495` follows it with «A kitchen table for her flat» – she has her own
home in the fiction, and it arrived as a gift. A court belongs THERE: a birthday gift at her own
place, offered only after the deposit has been given, priced like the big gifts. **Not a shop item at
all**, because the shop is the parent's and this is hers.

#### ⚙ 26.08 – AND HE GAVE IT AN EFFECT

> «а у корта для нее может быть скрытый бонус, кстати! Например она меньше устает за неделю, скажем
> на 1 очко»

⭐ **The effect is right and the story it tells is the best thing in this file.** A court at her own
place adds **+1 to what a week returns** – and because
[the-long-goodbye](the-long-goodbye-2026-08.md) §4a is closing that corridor with age, its RELATIVE
worth grows every season: +1 on a base of 4.91 at twenty-nine is +20%, and +1 on 2.65 at forty-one is
**+38%**. ⭐⭐ **The court he gave her at nineteen is what lets her play to forty.** Nothing else in
either spec pays off across twenty years like that, and it costs the player nothing but a birthday.

⚠⚠ **BUT IT BREAKS THE RULING THAT MAKES THE GIFT SCENE WORK, AND THAT HAS TO BE SAID.** Gifts are
free by his own ruling, and `birthday.ts`'s header says exactly why: «with no price the four options
differ only in WHAT THEY ARE» – a priced catalogue would turn a scene about a girl into a scene about
a balance. **A free gift carrying a permanent mechanical advantage is strictly dominant**: every
player takes the court every time, the other three become traps, and the scene stops being a choice.

⚙ **26.08 – AND HE ANSWERED THAT OBJECTION, correctly, so rule 2 below is HIS and not mine:**

> «верно, но только если знают об этом, я предложил сделать бонус скрытым. А рядом какие-то не менее
> ценные варианты подарков, например. Будет некоторого рода ребус, головоломка.»

⭐ **He is right and my fix was the wrong one.** I proposed «one exception only», which protects the
scene by keeping it thin. His is better: **make SEVERAL gifts carry hidden weight of comparable
value**, and the scene becomes a puzzle instead of a lookup. Dominance needs two things – an
advantage AND knowledge of it – and a player who learns one effect (they will; there are saves, and
there is a community) still faces a real trade-off if the neighbours are worth as much in a different
currency. ⚠ One hidden bonus beside three inert options is a secret worth knowing exactly once, and
then the scene is solved forever. Four that trade off never solve.

**The design that keeps both:**

1. **The court is offered ONLY after the deposit has been given.** She has to have a place before it
   can have a court. That costs a whole birthday to reach, so it can never be a first pick, and the
   deposit – the warm, unmechanical gift – stays the thing that opens the road.
2. ⭐ **HIS RULE: the catalogue carries several weighted gifts, and no one of them is strictly best.**
   They must pay in DIFFERENT currencies, or the puzzle collapses back into a ranking. Candidates,
   and this set needs designing rather than declaring: the court pays in rest; a gift that settles her
   somewhere pays in composure (⚠ which the decline never touches – see `veteranPoise` – so it
   compounds late); a gift about her people pays where the private-life layer will read it. **The
   acceptance is that no option wins on more than one axis**, measured over careers, and that is a
   real design task rather than a paragraph.
3. **The bonus applies on weeks she is NOT competing** – rest and practice weeks, the ones she spends
   at home. It is a court, not a charm: it does nothing in a hotel in Ostrava. ⭐ That also makes it a
   reward for a schedule the player CHOOSES rather than free value, and it grows naturally into the
   late career, when she plays less and rests more.
4. ⚠ **Hidden means never a number on a card**, in the house's own habit (the coach's room note, the
   broker in §6). The player is told she has somewhere to practise, not «+1». The effect is visible
   where every effect in this game is visible – in the condition line, over weeks.

**Acceptance, and both are veto conditions:**

- the court may not move the ending's median age by more than **one year** (§6 of the-long-goodbye
  measures that number anyway, so this is free to check);
- it may not raise the season injury prevalence, which round 26 already found **17 points over its
  own band**.

⚠ Its build goes to the birthday wave, not to this spec. Recorded here so the idea is not lost.

### 3e. ⚠ «A flat near the academy» – struck entirely

His three questions killed it and they were the right three: «у какой академии? Когда академия
перестает ее поддерживать в чем ценность? И зачем она родителям?» There is no single academy in the
fiction to be near, the value evaporates the moment the academy relationship ends, and the parent has
no reason to want it. Replaced by §3c.

### 3f. The elite – and they are not bought, they are COMMISSIONED

> «Может что-то элитное добавить - яхты или самолеты? Со временем постройки около реальным - купил и
> ждешь пока будет готово, яхты строят несколько лет.»

⭐ **This is the best idea in his list, because waiting is a mechanic no other family has.**

⚙ **26.08, his: «тоже можно разные тиры сделать, кстати и потерю стоимости в год + годовое
обслуживание (недельный кост, ага)».** So each family is a ladder, and each thing carries THREE
numbers rather than one – what it cost, what it loses, and what it takes every week to keep.

| thing | price | build | loses / year | upkeep / year | **upkeep / week** |
| --- | --- | --- | --- | --- | --- |
| the launch | $900,000 | ~12 months | 7% | 6% | **$1,040** |
| the sailing yacht (was: the motor boat, part three P1) | $2,400,000 | ~18 months | 7% | 6% | **$2,770** |
| the yacht | $12,000,000 | ~3 years | 5% | **10%** | **$23,080** |
| the big yacht | $28,000,000 | ~4 years | 5% | **10%** | **$53,850** |
| the plane | $18,000,000 | ~2 years | 6% | 8% | **$27,690** |
| the long-range plane | $38,000,000 | ~3 years | 6% | 8% | **$58,460** |

⚠ **THE UPKEEP PERCENTAGES ARE THE REAL ONES AND THAT IS WHY THEY HURT.** A yacht genuinely costs
about a tenth of its value a year to keep – crew, berth, fuel, survey, insurance – and at $12M that
is **$23,080 a week, which is roughly thirty-eight coaches**. The number is not a punishment invented
for balance; it is what the thing costs, and it is the whole argument for owning one being a
statement rather than an investment. ⭐ The weekly figure is what appears in the ledger, beside the
masseur, which is where the decision actually lives.

**How commissioning works.** The money leaves on order. The thing arrives N weeks later. Between
those two weeks the player owns a *contract*, not a boat – and ⚠ **the contract cannot be sold**,
which is the freeze mechanic (§4) arriving early and by consent rather than as a surprise.

⭐ **THE RUNNING COST IS A WEEKLY BILL, exactly like the coach's**, and that is deliberate: the toys
compete with the team for the same money. A yacht crew and a masseur come out of one wallet, and that
is a real decision rather than a trophy.

#### ⚙ 26.08 – THE PLANE GETS AN EFFECT, and he corrected my objection

> «Самолёт не её, а родителей =) Теоретически может вполне резать косты на перелеты до соревнований,
> почему бы и нет. По усталости по аналогии с кортом может 1 накинуть, не вижу причин не делать, не
> такая большая величина»

**He is right on the first half without qualification.** I wrote «the plane must not make her better»
while thinking of it as her equipment; it is the FAMILY's, and cutting the travel bill is a money
effect on a cost the game already models in full (`coachTravelFareFor` and the travel line the
masseur's fare was priced against). Money buying cheaper logistics is not pay-to-win – it is the
tycoon loop working correctly.

**And on the second half he is right too, for a reason neither of us said out loud: the two effects
land on DIFFERENT WEEKS, so they cannot stack.**

| gift / asset | +1 applies on | who it is for |
| --- | --- | --- |
| **her court** (§3d) | weeks she is NOT competing – rest and practice, spent at home | hers, a gift |
| **the plane** | weeks she IS travelling to an event | the parents', bought |

⭐ **That is the whole answer to my stacking worry and it is better than a cap.** No week can receive
both, so a family owning everything gets a corridor that is one point kinder across the board – never
two – and the two items stay complementary rather than additive. The court rewards resting at home;
the plane softens the road. They describe different lives.

#### ⚙ 26.08 – ⭐⭐ A WEEK ON THE YACHT IS A VACATION PACKAGE

> «а неделя на яхте (при наличии яхты) вполне может стать новой строкой отпуска, кстати»

**This is the idea that makes the whole elite family earn its place, and it costs almost nothing to
build.** `ECONOMY.vacation.packages` already holds six – `staycation` (free, `conditionGain: 10`)
through `elite`, stepping by 8, each with a `buffFactor` riding `buffWeeks: 4` afterwards. A yacht
week is a seventh, and its shape is unusual in exactly the right way:

- **`priceCents: [0, 0]` – it is free at the point of use**, because the money went years ago and the
  upkeep is charged every week whether she sails or not;
- **it appears in `PlanWeekSheet` only while the yacht is owned and delivered** (⚠ not while it is
  still building – §3f's contract is not a boat); ⚙ **AMENDED by part two #8 – see §13g**: the row
  is on every family's sheet at a real charter price now, and delivery is what makes it FREE;
- its gain sits **at or above `elite`**, which is the priciest package in the game.

⭐⭐ **AND THIS IS WHAT TURNS THE YACHT FROM A TROPHY INTO A DECISION.** Before it, the absurd family
was status with a bill – the one part of this spec that risked being a number going up. After it, the
$23,080 a week buys a thing the player uses, on a screen he already knows, and the question «is the
yacht worth it?» becomes arithmetic he can actually do: **it is about 1.4 elite vacations a week in
upkeep, and it gives him one.** That is a genuine, losable bet rather than a purchase.

⚠ It also means the yacht must NOT be the strictly best rest week available – if it is, every owner
takes it every time and the other six packages die on the same day the yacht arrives. Either it ties
with `elite` and wins on being free, or it beats it slightly and `elite` keeps a reason to exist that
is not price. **That is a tuning question for the slice, and it is named here so it cannot be
forgotten.**

⚠ **THE ACCEPTANCE IS ON THE AGGREGATE, NOT PER ITEM.** Every such bonus in the game is measured
together against the same two numbers: the ending's median age may not move by more than **one year**,
and the season injury prevalence may not rise (it is already 17 points over its band). If the total is
too kind, the bonuses shrink before anything else is touched. ⚠ A per-item budget would let a third
one arrive later and quietly break what the first two respected.

### 3g. ⭐⭐ The apogee – her academy

> «построить свою академию за много миллионов - тоже может быть интересно, кстати. Как раз будет куда
> рекламное тратить.»

**The end of the money, and the answer to a hole this game already has.** Round 23 measured it: Ines
earns $2.57M a year against $220k of costs, and her INTEREST ALONE ($251k) exceeds every outgoing she
has. The money has nowhere to go. An academy is where it goes.

- **Cost: $8–15M**, in STAGES rather than one press – land, courts, the building, the staff. Each
  stage is a decision and a bill, and a half-built academy is a real state the player can sit in.
- ⭐ **His own connection: this is where advertising money lands.** The face-and-court plan's fame and
  endorsement income currently has no destination beyond the balance. Cross-referenced both ways.
- **It is the one asset that outlives the career**, so it belongs in the epilogue by construction: the
  album can say what the money became. ⚠ That makes it the strongest candidate of anything in this
  file for actually being built – it converts a measured dead end into an ending.

---

## 4. Prices that move

- **DRIFT** – a small per-week move around each family's own trend.
- **SHOCK** – rare, large, both directions. What makes an asset a story rather than a line item.
- **FROZEN** – ⭐ the sharpest idea in his original ask, and one a normal shop never has: the asset
  **cannot be sold** for an indefinite stretch. It is the only mechanic here that can hurt a player
  who did everything right, and it stops «buy low, sell before the season» from being free.

⚠ **A FREEZE MUST BE SURVIVABLE.** It may never be the reason a family goes bankrupt – the bankruptcy
door reads liquid funds, and a frozen asset is not liquid. Acceptance: over a career sweep, **zero
bankruptcies whose proximate cause is a frozen asset**.

⚠⚠ **DETERMINISM.** Every roll goes through a purpose-scoped sub-stream –
`rngFromSeed(\`${seed}:asset:${assetId}:${week}\`)` – and NEVER the MAIN weekly stream. A player's
purchase may not move the world's dice (`CLAUDE.md` §2). The frozen MAIN capture (41550 /
`e6b0c709`) must be unmoved by every slice here; if it moves, the sub-stream leaked.

---

## 5. The data

```
OwnedAsset = {
  id: AssetId
  boughtWeek: number
  paidCents: number
  valueCents: number
  readyWeek: number | null    // §3f – null once delivered, a future week while building
  frozenUntilWeek: number | null
}
WorldState.assets: OwnedAsset[]        // empty on every existing career
```

- **Cents, one wallet.** No second currency. Buying is an `expense` row, selling an `income` one,
  through the same till every other cost uses.
- **`valueCents` is stored, not derived** – a derived value would have to be recomputed identically by
  the screen and the ledger, and this repo has been bitten twice by two sides asking different
  functions about one question.
- **The catalogue is a constant, not save data** (`ECONOMY.shop.catalogue`), so adding an item later
  is not a migration. Only what she owns persists.
- ⚠ **Whole numbers reach the interface.** Fractions may live in the engine; every figure that
  crosses into `Snapshot` for a person to read is rounded, at the boundary and not in each component
  – his rule of 26.08, argued in [the-long-goodbye](the-long-goodbye-2026-08.md) §4a.

**Guard class:** a shop command is about the FAMILY'S OWN money, so it belongs to
`guardNotEndedForGood` – the short list round 24 created that holds the vacation cancel and the
birthday gift – and NOT to the tour-command guard that refuses inside the college freeze. ⭐ That is
what makes the college years shoppable, which the backlog's §0a argues is the shop's best moment.

---

## 6. The broker

Modelled on the coach: a weekly cents fee, tiered, cancellable, roughly the middle coach's band **so
the two compete for the same money**. What he sells is **legibility, never return**: he names the
BAND («this is above its trend», «this one has not moved in eleven weeks») and can warn a freeze is
likely before it lands.

⚠⚠ **HE MAY NEVER PROMISE A NUMBER.** The moment he predicts a return, the optimal play is «hire him,
follow him» and both the shop and his fee stop being decisions. **Acceptance: a career following every
broker line may not out-earn one ignoring him by more than his own fee.**

---

## 7. Her cut of the returns – his suggestion, with one design note

> «её можно всё тот же % дохода от инвестиций перечислять, в принципе»

`ECONOMY.kidShare` is already the ramp: from **18**, starting at **10%**, **+5%** a step, capped at
**50%**. Applying it to investment income needs no new curve.

⚙ **SETTLED 26.08: a standing instruction, not automatic – «договорились».**

⚠ **AND THE DIFFERENCE MATTERS.** Her share
of PRIZE money is hers because she won it – the engine pays it without asking, correctly. Investment
income is the parent's, earned by the parent's capital, and handing her a cut is a **decision**. Make
it automatic and it stops being generosity; make it a switch he sets once and it becomes one of the
few purely warm choices in a game largely about spending. His «в принципе» reads as an option rather
than a rule, and this is that reading made mechanical.

---

## 8. Charity

**The giving is free, and the world notices.** No progress bar, no tier, no «donate $50,000 to
unlock». What may come back is real, unpriced and unpromised: an invitation because of who she has
become; a sponsor whose values match turning up on his own (⭐ converting giving into MONEY); a line in
the ending that names it. ⚠ It is the only mechanic here that spends with no way back, which is what
makes it able to turn late-career wealth into a statement rather than a bigger number.

---

## 9. What I would add to his list

He asked. Four, in the order I would rank them:

1. ⭐⭐ **The club stake pays in TENNIS, not only in money** (§3a). A club she can train at, that
   changes what a practice week costs rather than what it does. It is the one item that makes the
   shop part of the game instead of beside it, and it is small.
2. ⭐ **Insurance, as the counter-play to the freeze.** A weekly premium that guarantees a floor price
   on one asset. It makes the freeze a risk to be MANAGED rather than a thing that happens to you,
   and it gives the broker something concrete to advise about. ⚠ Priced so that insuring everything is
   strictly worse than insuring nothing – it is a hedge, not a subscription to safety.
3. **Naming a tournament.** Late-career money buying prestige rather than objects: her surname on a
   W-tier event, a running cost, and the field notices. Cheap to build on the ladder that exists.
4. **A stage in the academy that is HERS to run** (§3g), after she retires. The epilogue currently
   ends the game; an academy she runs is the first thing that could make an ending feel like a
   beginning. ⚠ Design-heavy, listed last on purpose, and not proposed for any slice below.

---

## 10. What is still his

1. **Does he want the academy (§3g) EARLY?** It is the strongest item in this file and the only one
   that closes a measured hole, but it is also the largest. It could be slice 2 instead of slice 5.
2. **Can he sell HER things?** My answer is no – it makes the parent a liquidator of her career.
3. ⚙ **SETTLED 26.08 – her cut of the returns is a SWITCH, not automatic** («договорились»), §7.
4. **Does the shop survive an ending?** My answer is yes and it is cheap: the retirement card names
   what the family owns. An ending that silently drops the house is a bug the player will feel.
   ⚙ **SETTLED 29.08, round 29 part two #10, for the academy** – his ruling: «Эпилог… надо
   добавить, мне кажется. Это всё-таки финал игры.» The epilogue names the academy when the family
   built any stage: what stands (N of M stages, the catalogue's own count) and – now that the
   academy EARNS – what it became (its weekly income, off `world/business.ts`' one arithmetic).
   Built as ONE engine-fed line in `EndingScreen.vue`'s footer (`EndingView.academy`, a wire field:
   no schema move), because the album's SHAPE is reserved by him – the photo-album concept is his
   backlog item, and this line deliberately does not touch it. The REST of the shelf at an ending
   is still open.

---

## 11. Slices

⚙ **QUEUED 26.08, by his word: «ставь в очередь после первой волны. это будет отдельной волной и
веткой, соответственно».** The shop starts after `wave/the-long-goodbye` lands – its own wave, its own
branch, and it does not begin while the ending wave is open (the house rule: one branch per wave).

⚠ Each slice is its own save-schema move and its own wave – separate PRs, never one.

⭐ **Slice 1 is what «более менее понятная часть» meant** – everything in it is static, so it answers
the only question worth asking first: is spending the parent's money on things fun in THIS game? If it
is not, slices 2–7 are a large amount of work built on a shrug, and this is the cheapest place to find
that out.

| # | slice | done when | state |
| --- | --- | --- | --- |
| **1** | **the tab, static prices, buy / own / sell** – the deposit and index fund (§3a), the four cars (§3b), the first two house tiers (§3c). No movement, no building, no freeze | a bench career buys the good car in season 3, sells it two seasons later, and the ledger shows the loss to the cent; `careerTotals` grows at most two fields; the frozen capture is unmoved; a previous-version save loads with `assets: []` and plays identically; ⚠ the shop is NOT the dominant outgoing before season 4 | ⚙ **BUILT 27.08 – schema v63, see §12** |
| **2** | **drift** (§4), one sub-stream, no shocks | the four families are distinguishable from the numbers alone, without being told which is which | Next |
| **3** | **commissioning** (§3f) – the elite ladders, the wait, the contract, the annual loss and the weekly upkeep; ⭐ **the yacht week as a seventh vacation package**; the plane's travel-cost cut and its +1 on travelling weeks | a career orders a yacht, waits three years, and the weekly upkeep sits in the ledger beside the masseur; the yacht week appears in `PlanWeekSheet` only once delivered, and it does not kill the other six packages | ⚙ **BUILT 29.08 – round 29 #5, see §13** |
| **4** | **shock and freeze** (§4) | zero bankruptcies whose proximate cause is a freeze, over a sweep | Next |
| **5** | **the academy** (§3g), in stages | a half-built academy is a legible state, and the epilogue can name the finished one | ⚙ **BUILT 29.08 – round 29 #5, §13; the epilogue half is NOT built, see §13d** |
| **6** | **the broker** (§6) | following him beats ignoring him by less than his fee | Later |
| **7** | **charity** (§8) | a gift changes something unpromised, and the ending can name it | Later |


---

## 12. ⚙ SLICE 1 AS BUILT (27.08, schema v63) – and three things this file got wrong

Recorded here rather than in a second document, because a spec whose acceptance was measured and
whose numbers moved is the only honest place to read either. Everything below is `wave/the-shop`.

### 12a. What shipped

`ECONOMY.shop.catalogue` (a constant, §5), `WorldState.assets` (the only persisted half),
`world/shop.ts` (`buyAsset` / `sellAsset` / `revalueAssets` / `shopView`), the fourth chapter on
`MoneyScreen.vue`, a `'shop'` ledger category, and the v62 → v63 migration. Zero draws on any
stream: the module imports no RNG and takes no `Rng`, and the frozen MAIN capture
(41550 / `e6b0c709`) is **unmoved**.

⚠ **`OwnedAsset` SHIPPED WITHOUT `readyWeek` AND `frozenUntilWeek`**, against §5's drawn shape and
deliberately. The argument is at the interface (`shared/protocol/profile.ts`) and in one line here:
the repo's shipped idiom for a field whose absence is its true value is an OPTIONAL key with no
back-fill (v59's `masseurReturnDue?`, `injuryHistory[].weeksSaved?`), so slices 3 and 4 can add
`readyWeek?` and `frozenUntilWeek?` with **no migration at all** – which is cheaper than the second
migration the nullable pair was meant to avoid. `sellableAsset` is the seam they widen.

### 12b. ⚠ §3c GAVE NO NUMBERS, so the two house tiers are MEASURED and they are mine

The spec names tiers, rent and a milestone and stops. `tools/shop-probe.ts` (`npm run probe:shop`)
measures what a family actually holds; under the `player` policy, 9 presets x 4 seeds, median funds
by season are **$19,974 / $5,732 / $16,052 / $18,824 / $46,268 / $494,189 / $1,492,297 / $2,531,675**.
So **$240,000** (first rung) and **$520,000** (the garden) land in seasons 5–6 for the median career
and season 4 for the p90 – after the turn, never before it – and **+3%/season** is the slowest
positive rate on the shelf, because a home that out-earned the index fund would make property the
right answer to every question and break §0's «assets never beat a career».

### 12c. ⚠⚠ THE THREE THINGS THIS FILE GOT WRONG

**1. §11 row 1's «static prices» and its own acceptance contradict each other.** «No movement» and
«the ledger shows the loss to the cent» cannot both be literal – a car that does not move has no loss
to show. Built as: **static means DETERMINISTIC, not frozen.** Values are arithmetic on `boughtWeek`
and draw nothing; §3b's 6/9/12/15% still bite. That is the only reading in which slice 1 answers the
question §11 says it exists to answer.

**2. §2e-1 and §5 disagree about what «the ledger» can hold.** `FINANCE_WEEKS` keeps **sixty** weeks
and `pruneEvents` caps the feed at 400 rows; two seasons is **104 weeks**. So a career that buys a car
and sells it two seasons later cannot see the two prices side by side anywhere – by the week of the
sale, the purchase is gone from the breakdown AND from the transactions tab. The loss survives only
because `sellAsset` names it in the row's own words («Sold: The good saloon – $18,909 less than it
cost»), taken off the stored `paidCents`. ⚠ **Slices 2–7 must not "tidy" that sentence into a number
pair.** Pinned in `tests/shop.test.ts`.

**3. ⚠⚠ §2e-5 IS NOT A PROPERTY THE SHELF CAN GUARANTEE, and the number says by how much.** Measured
with a deliberately eager shopper – buys the good car the first week the shelf is open, the price is
affordable and the policy's own reserve still stands; sells exactly two seasons later:

| policy | careers | bought before season 4 | season-slots (career x season 0–3) where the shop was the LARGEST outgoing | worst shop share of a season |
| --- | --- | --- | --- | --- |
| `grinder` | 54 | 0 | **0 of 216** | 0.0% |
| `player` | 36 | 4 | **4 of 144 (2.8%)** | **69.1%** |

The four are `8k working` x2, `25k middle · budget` (season **2**) and `25k middle · high`. The cause
is arithmetic rather than tuning: a purchase is a LUMP and a season of tennis is a DRIP, so any car on
an open shelf is the largest line of the season it is bought in. §2 opens the shelf on the
professional era, which the same probe measures at a **median of season 2** (open before season 4 in
86% of `player` careers) – so §2 and §2e-5 cannot both hold as written.

⭐ **§2 already contains the resolution and it is the owner's own distinction**: «the backlog's §0
warning is about being USABLE, not about being VISIBLE». VISIBLE is settled; BUYABLE early is not, and
this is the decision that needs him:

⚙⚙ **SETTLED 27.08 – (a), and his reason is better than the option's own.** «магазин есть и всё, мы
не можем запретить там что-то покупать».

⭐ **That closes §2e-5 by RETIRING IT, not by satisfying it.** A shop the player can see but not use
is a shop that lies about itself, and «the money must go somewhere else first» was written as a
property of the SHELF when it was only ever a property of the ECONOMY. The economy already enforces
it and the measurement says so: 89% of `player` careers and 100% of `grinder` careers buy nothing
before season 4 without being stopped, because they have nothing to buy with. The four that do had
banked six figures. **A gate would have taken a real decision away from the four families who earned
it, to make a number in this file true.**

⚠ §2e-5 is therefore struck as an acceptance condition and kept as an OBSERVATION – the figure is
still worth re-taking when the shelf grows, because a cheap shelf and an expensive one are different
questions, but it can no longer fail a slice.



- **(a) leave it** – 89% of `player` careers and 100% of `grinder` careers never buy before season 4
  at all, and the four that do are families that genuinely banked six figures by season 3. Shipped as
  this, because inventing a gate the spec does not have is not slice 1's to do.
- **(b) a buy gate above the visibility gate** – e.g. the shelf is browsable from the professional era
  and buyable from season 4. Cheap (one predicate in `buyAsset`, one flag on `ShopView`), and it makes
  §2e-5 true by construction.
- **(c) price the first rung under a season of tennis** – rejected here: §3b's ladder is his own
  («от 60 до 300к»), and moving it to satisfy §2e-5 would trade a stated ruling for an unstated one.

---

## 13. ⚙ SLICES 3 AND 5 AS BUILT (29.08, round 29 #5) – and four places this file was silent

Recorded here beside §12 rather than in a second document, for §12's own reason. Everything below is
round 29 #5, on `r29g/shop-elite-academy`, and **`SAVE_SCHEMA_VERSION` did not move: it is still 65.**

His ask, in full: «В магазине всё ещё не хватает яхт, самолётов и стойки академии».

### 13a. What shipped

Ten new rungs in `ECONOMY.shop.catalogue` – §3f's six commissioned ones and §3g's four academy
stages – plus `world/assets.ts` (a new LEAF holding the shelf's pure reads), `deliverAssets`,
`assetUpkeepCents` / `weeklyAssetUpkeepCents`, `resolveAssetUpkeep` in the weekly till,
`HouseholdWeekly.upkeepCents`, the `yacht-week` vacation package with its own drawn week and its own
diary lines, and the plane's two effects. Zero draws on any stream; the frozen MAIN capture
(41550 / `e6b0c709`) is **unmoved**.

⚠ **`OwnedAsset` GAINED `readyWeek?` AND NOTHING ELSE, exactly as §12a predicted it would** – «slice 3
can add `readyWeek?: number` (absent = delivered) … with **no migration at all**». It did, so there
is no v66, no migration and no golden fixture. `sellableAsset` is the seam §12a named and it is the
one function that changed.

⚠ **AND THE VALUE CLOCK RE-USED `basisWeek` RATHER THAN GROWING A SECOND ONE.** A commissioned thing
is ordered years before it exists, so `buyAsset` writes `basisWeek = readyWeek` and
`assetValueCents`' own `Math.max(0, weeksHeld)` holds the contract at what was paid for the whole
wait. One field, one sentence («the compounding clock's start»), no branch in `revalueAssets` and no
second value model.

### 13b. ⚠⚠ THE FOUR PLACES THIS FILE WAS SILENT, and what was chosen

**1. §3g GIVES NO PER-STAGE PRICES**, only a band and four names. So the four are MEASURED against
his band rather than declared, the same way §12b's two house tiers were: land $2M, courts $3M, the
clubhouse $4M, the staff $3M = **$12,000,000**, the middle of «$8–15M». ⚠ They are also the one
exception to the catalogue's «cheapest first»: the stages read in BUILD order, because `requiresId`
chains them and a stage cannot be bought before the one under it.

**2. §3g GIVES THE ACADEMY NO WAIT, NO UPKEEP AND NO RATE**, and it was given none. §3f's «время
постройки» and «годовое обслуживание» are said of the boats and the planes; §3g's own sentence is
«each stage is a decision and a bill», and a stage IS the wait. The rate is 0, so the shelf says
«Holds its value» – which is what «the one asset that outlives the career» reads like with no number
attached.

**3. §3f GIVES THE PLANE'S FARE CUT NO PERCENTAGE.** His verb is «резать» and not «убрать», so it is
**half** (`ECONOMY.shop.planeTravelShare`), and it comes off every seat the family pays for – hers,
the coach's and the masseur's – because it is one aeroplane carrying all of them. Three reasons for a
half rather than the whole fare are written over the constant; the load-bearing one is that a fare
which fell to zero would take the travel LINE off the ledger, and a cost the player cannot find is
this repo's own named defect. ⚠ It is **not a balance lever in either direction**: a season of travel
is four figures and the aircraft costs $27,692 a week to keep.

**4. §3f NAMES THE YACHT WEEK'S TUNING QUESTION AND DOES NOT ANSWER IT** – «Either it ties with
`elite` and wins on being free, or it beats it slightly and `elite` keeps a reason to exist that is
not price.» Built on the **first** arm: `conditionGain: 48`, the same as elite, free, and
`buffFactor: 1` against elite's `0.85`. So the yacht wins on price and elite keeps the injury buff,
which is a currency a boat cannot pay in – and §3f's veto («the yacht must NOT be the strictly best
rest week available») holds. ⚠ A gain above 48 would break it, and `tests/planner.test.ts` says so.

### 13c. ⚠ WHICH RUNGS GRANT THE WEEK, and it is the narrow reading

**`yacht` and `yacht-big` only.** «при наличии яхты» is the sentence, and the two rungs below them
are a launch and a motor boat – the spec calls neither a yacht, and §11 row 3's own acceptance is «a
career orders a yacht, **waits three years**», which is the $12M rung's build time and not theirs.
A week away on a day-boat is not a holiday.

⚙ **RE-ARGUED AT PART THREE P1 (29.08), SAME ANSWER.** «моторка $2.4М – давай переделаем на
парусную яхту пожалуйста» renamed the $2.4M rung to **the sailing yacht** – so «the spec calls
neither of them a yacht» stopped covering the shelf, and the ruling had to be re-derived rather
than inherited. It survives on a better leg: the WEEK the package sells is a **crewed** week («crew
of six, and a week of it is a week nobody can reach them»), and the crew is what the two granting
rungs' 10% upkeep is buying – the sailing yacht keeps the boats' crewless 6% (hull, berth, survey).
A family that sails itself has a boat, not a holiday staff. The grant reads what the upkeep pays
for, never the noun in the label; the sailing yacht grants nothing, and
`tests/round29-shop-elite.test.ts` holds the claim against the delivered rung.

### 13d. ⚠⚠ WHAT IS **NOT** BUILT, AND IS STILL OPEN

- ⚙ **RESOLVED 29.08 – the epilogue names the academy now** (round 29 part two #10). This bullet
  stood on «it has never been ruled on», and he ruled: «Эпилог… надо добавить, мне кажется. Это
  всё-таки финал игры.» The word arrived and the line shipped – see §10.4's ⚙ note for what was
  built and what stayed deliberately untouched (the album's shape is his).
- **No academy stage does anything yet.** §3g's own «this is where advertising money lands» is a
  cross-reference to the face-and-court plan, not a mechanic in this file, and §9.4 («a stage that is
  HERS to run, after she retires») is explicitly «listed last on purpose, and not proposed for any
  slice below». The academy is, today, the end of the money and a thing the family owns.
- **§4's drift, shock and freeze are still slice 2 and slice 4.** Nothing here draws.
- ⚠ **A STAGE CAN BE SOLD OUT FROM UNDER THE ONE ABOVE IT.** `requiresId` gates BUYING and nothing
  gates selling, so a family that owns the land and the courts may sell the land and keep the
  courts – which is not a state that means anything. It is one predicate in `sellableAsset` to
  close, and it was deliberately NOT written: §3g asks for stages and says nothing about unwinding
  them, and a refusal the spec does not have is not this slice's to invent. **Flagged for him**, and
  it is small either way.

### 13e. ⚠⚠ THE GATE IS GONE – HIS RULING, ROUND 29 PART TWO #6 (29.08)

«магазин открыт всегда с начала игры.»

This section read «THE GATE IS UNCHANGED, AND THAT IS A DECISION», and the decision has been made the
other way by the owner. **§2's «visible from the first week of the professional era and never in the
junior years» is overturned.** `shopUnlocked` (`activeLadderOf === 'wta'`), `SHOP_LOCKED_DETAIL`, the
`ShopView.unlocked` / `lockedDetail` pair and the screen's shut arm are all deleted; what went and
why is written out where the predicate stood in `src/engine/world/shop.ts`.

⭐ **It closes round 29's ask 12b.** #12 removed the current account's automatic interest and measured
the loss at its cleanest on the junior sink – the one horizon where the shelf that replaces it was
shut. The replacement now exists there, and part two #3's rate (200 → 317 bps, «не вижу проблем
сделать ставку 3.17% на Savings») is the other half of the same repair.

⚠ **What a fourteen-year-old can now see and buy, checked rung by rung, because a rung that BREAKS at
that age would be a real defect where a rung merely out of reach is not.** Nothing on the shelf reads
about her or reaches her: §1's «the shelf belongs to the PARENT» is the whole catalogue's rule, the
two items that were about her were struck before slice 1 shipped, and every remaining effect is the
family's – a car depreciating, a house owned, a boat's upkeep, the plane's fare cut and its kinder
travelling week (`world/sponsors.ts`, `world/medical.ts`), the academy's stages. **Reachable at 14:**
the deposit ($1,000) and, for a wealthy family, the index fund ($5,000) – which is exactly the pair
ask 12b was about. **Visible and priced out:** the five cars, the houses, the boats, the planes and
the four academy stages, which is §2's own «a shop window is a thing you look into before you can
afford it». **Nothing breaks:** `requiresId` still orders the academy stages, `buildWeeks` still
makes a boat a contract before it is a boat, and `guardNotEndedForGood` is still the one refusal.

§12c had already settled the buy-gate question inside the shelf with his own words – «магазин есть и
всё, мы не можем запретить там что-то покупать» – so no second gate was invented for the expensive
rows, and this ruling extends the same sentence to the door. What gates them is the price: a $38M
aeroplane is out of reach of every career the probe has ever walked, and
§12b's own funds table (median season 8 at $2.5M) says the boats' bottom rung is the first storey a
very good career can reach at all. ⚠ **That is worth his eye**: most careers will see these rows and
never press one, which is §2's «a shop window is a thing you look into before you can afford it»
taken to its limit.

### 13f. ⚠ AND THE ONE THING THAT COULD STRAND A FAMILY WAS CHECKED

A yacht is **$23,076.92 a week**, which is roughly thirty-eight coaches, and the shelf has no
bankruptcy guard. The two states are disjoint by construction and that is what makes it safe:
**while it is being built it cannot be sold and it charges nothing; the week it arrives the upkeep
starts and it becomes sellable the same week.** There is no week in which a family is paying for a
thing it has no way out from under, which is §4's own acceptance («a freeze may never be the reason a
family goes bankrupt») met by the shape rather than by a rule. Pinned in
`tests/round29-shop-elite.test.ts` §2.

### 13g. ⚙ THE YACHT WEEK BECAME A CHARTER – round 29 part two #8 + #9 (29.08)

> «она же бесплатная только при наличии яхты, верно? я могу сделать для нее отдельный арт, тогда
> можно просто на постоянку добавить в ленту сначала с реальной стоимостью, а после покупки яхты это
> станет бесплатным» – and, on the price: «изначально стоит дороже немного (х1.4 вроде мы считали,
> да?)»

**This amends §3f's second bullet** («it appears in `PlanWeekSheet` only while the yacht is owned
and delivered»): the row is on **every** family's sheet now, at a real charter band, and taking
delivery of a yacht is what zeroes it. The flag turned with the design – `grantedOnly` (hide the
row) became `freeOnceGranted` (zero the quote) – and one function prices every surface:
`vacationPriceCents(seed, week, id, background, grantedIds)` is the sheet's quote, the
recommendation's weight and the booking's charge, so a screen and the engine cannot price the same
week two ways. `bookVacation`'s old refusal («The family does not own that») is gone with the
design it guarded; the engine-side re-validation moved from the row to the **price** – a stale
sheet books at the world's own quote, never a stale free one.

⚠ **THE ×1.4 WAS VERIFIED BEFORE IT WAS USED**, because «вроде мы считали, да?» is a question and
the spec outranks his memory. This file carries exactly **one** 1.4 – §3f's own «it is about 1.4
elite vacations a week in upkeep» – which relates exactly these two packages and no other charter
figure exists anywhere in it. So his multiplier lands as the figure of record: the charter band is
**elite ×1.4 = [$5,600, $9,800]** before the wealth corridor, sitting above elite as the ladder's
top step (strictly ascending floors, all seven, pinned in `tests/planner.test.ts` – the RELATION to
elite's band is pinned beside the literal, so neither can be retuned alone).

⚠ **§3f's veto survives on both sides of the grant, for free.** The owner's family still ties elite
at 48 and wins on being free; the boatless family sees the same 48 at a **dearer** price with a
weaker after-effect, so elite keeps its reason everywhere and the six packages survive the row
appearing on every sheet.

⚠ **His art for the row is coming** («я могу сделать для нее отдельный арт»); until it lands the
sheet draws the row artless through `vacationArtUrl`'s documented null fallback – a catalogue entry
may exist before its frame does, and a missing picture must not cost the row.

⚠ **What did NOT move**: `Snapshot.shop.vacationIds` (same machinery, new meaning: «made free», not
«may see»), the grant's DELIVERED-only read, `conditionGain` 48 / `buffFactor` 1, the diary's two
yacht-week sentences (ownership-neutral, they fit a charter), and the week's calendar arc. Zero
MAIN draws anywhere in this: the charter quote is the same purpose-scoped
`seed:vacation:week:packageId` sub-stream every package has always used.

---

## 14. ⚙ §4's MOVING PRICE AS BUILT (29.08, round 29 part three #16) – the fund has a market

Recorded here beside §12 and §13, for their reason. Everything below is round 29 part three #16, on
`r29p3/market-fund`, and **`SAVE_SCHEMA_VERSION` did not move: it is still 65.** No field was added
to `OwnedAsset`, no migration, no golden fixture – the market is read off the career seed, so there
is nothing about it to persist.

His ask, in full:

> «Механику фонда надо придумать, да, потому что безрисковые 3 против безрисковых 7 это весьма
> странно. Давай подумаем как это можно сделать красиво и просто.»

And his ruling on the design: «вроде посмотрел, давай сделаем, а я пощупаю и скажу свои ощущения
потом.» ⚠ **He will judge it by feel after playing, so every number here is provisional by his own
framing** – §14d says which knob moves what.

### 14a. What shipped

`src/engine/world/market.ts` (a new leaf: `marketWave`, `marketIndex`, `marketRatio`,
`worstMarketRatio`), `ShopItem.volBps`, `assetWorthCents` and `marketSeasonMove` in
`world/assets.ts`, a fourth argument on `assetValueCents`, `reportMarketSeason` in `world/shop.ts`
called at the end of the obligations phase, and `volBps: 1_800` on the index fund. Every other rung
on the shelf is priced by exactly the arithmetic it was priced by yesterday, to the cent.

**The model, whole:**

```
wave(seed, week)  = Σ ampᵢ · smoothstep-interpolated value noise at periodᵢ     ∈ [-1, 1]
index(seed, week) = exp(volBps/10⁴ · wave)
worth             = basisCents · (1 + annualRateBps/10⁴)^years · index(now)/index(basisWeek)
```

Three octaves: **104 weeks at 0.15, 39 at 0.50, 26 at 0.35**. Anchors are drawn from
`rngFromSeed(\`${seed}:market:${period}:${anchor}\`)` – purpose-scoped sub-streams, the pattern
`:calweek:` / `:growth:` / `:conveyor:` already use, re-derived at the call site and persisting
nothing.

### 14b. ⭐⭐ THE LOAD-BEARING PROPERTY: the market exists whether or not she buys

The path is a fact about the world, like the weather. It is **READ** at the two weeks a holding spans,
never **DRAWN** when one is opened. That is what makes RNG input-independence – the permanent law,
frozen capture 41550 / `e6b0c709` – unreachable rather than merely respected: there is no code path
by which a purchase could move the world's dice, because owning nothing draws exactly the same
numbers as owning everything.

⚠ **It also kept `revalueAssets` idempotent**, which the per-week roll §4 originally sketched would
have destroyed. A rolled drift depends on how many times the phase ran; a read path does not, so the
second press of the fast-forward button prices a holding exactly as the first did.

**Proved, not claimed** (`tests/round29p3-market.test.ts`): three careers on one seed and 160 weeks –
one that never touches the shelf, one that opens the fund, one that opens it inside a busy shelf of
top-ups, part sales and a car bought and sold. `rngMain` is **byte-identical** in all three
(`{s, n}` is a complete and self-redundant description of the MAIN position), and the two that hold
the fund agree on its worth **to the cent**. The frozen MAIN capture is **unmoved**, and
`tests/coach-travel-edge.test.ts`'s three frozen career hashes are unmoved with it.

### 14c. ⚠⚠ THE LONG HORIZON IS SAFE, and it is a PROOF before it is a sample

«On a long horizon the fund MUST beat Savings. Otherwise it is a trap for a player who did not read
carefully», and «мы ни за что не наказываем» is house law.

Because `wave` is bounded in `[-1, 1]`, the worst the market can ever do to a holding is
`e^(-2·vol)` – so the fund beats the 3.17% deposit at ten years for **every seed and every pair of
weeks** exactly while `1.07¹⁰ · e^(-2·vol) > 1.0317¹⁰`, which solves to **`vol < 1,824 bps`**. The
shipped 1,800 sits just under that line, deliberately: it is the most risk the design can carry and
still be safe to hold.

⚙ **MEASURED** (`npx vite-node tools/market-probe.ts --seeds 4000`, 29.08 – 228,000 rolling seasons,
48,000 holdings per horizon over 4,000 seeds x 12 entry weeks):

| | 1 year | 3 years | 5 years | 10 years |
| --- | ---: | ---: | ---: | ---: |
| fund beats the deposit | **67.07%** | **90.24%** | **98.73%** | **100.00%** (0 of 48,000 lose) |
| mean fund | +7.3% | +22.9% | +40.7% | +97.3% |
| the deposit | +3.2% | +9.8% | +16.9% | +36.6% |
| worst fund seen | −18.5% | −11.7% | +5.4% | **+48.5%** |

Negative seasons **19.9%** – «roughly one year in four or five». Season sd **8.35%**; worst
peak-to-trough on a holding **−20.4%**.

⚠ **AND THE PROOF IS STRICTLY STRONGER THAN THE SAMPLE, which is why both are pinned.** Raising
`volBps` to 2,500 breaks the inequality – and 2,400 sampled ten-year holdings still all won. Sampling
cannot see a ceiling this design is only just inside.

⚠⚠ **SUPERSEDED IN PART BY §14h (his crash extension, 29.08)**: the table above is the WAVE-ONLY
measurement and the ten-year universality is now the CALM-WATERS tier of a two-tier bound. The
current numbers, the crisis calendar and the measured ten-year tail are all in §14h.

### 14d. The knobs, and what each one moves

| knob | where | moves |
| --- | --- | --- |
| `volBps` | `ECONOMY.shop.catalogue` (index-fund) | how hard the fund rides the market. ⚠ **Capped at 1,824** by §14c's inequality. |
| `annualRateBps` | the same rung | the LONG-RUN figure, unchanged at 700 – the market moves either side of it, so the shop card's «7% a year» needed no re-wording. |
| the octave mix | `world/market.ts` `OCTAVES` | trends against felt risk. A tide much longer than a season barely moves within one, so amplitude spent there buys texture and costs negative years: a four-year-dominant mix measured **7.3%** negative seasons against this one's **19.9%**. ⚠ The amplitudes must sum to 1.00 or §14c's bound – and its proof – is gone. |

### 14e. ⚠ WHAT IS **NOT** BUILT, and one thing that was ruled out

§4's **SHOCK** and **FREEZE** are still not here, and neither is §6's broker.

⚠⚠ **AN EARLY-EXIT FEE OR SPREAD WAS CONSIDERED AND REJECTED**, and it is written down so it is not
re-proposed: «that is friction, not risk, and it does not answer "why is a risk-free 7% sitting
beside a risk-free 3"». A path that moves IS the answer; a toll on the door is a different mechanic
wearing its coat.

### 14f. ⭐ THE SEASON LINE – the half of the item that is not the mechanic

One `info` row a season, on the season boundary, while the family holds a market rung:

> A season of the market – An index fund is down 8% over the season.

Without it a player sees a smaller number and cannot tell why, which is the blindness that produced
round 29 #10: **the number moving is not the same as the number being legible.**

⚠ It reports the **MARKET** and not the holding. A family that topped up in week 40 has a personal
return nothing like the market's year, and quoting that here would be a third arithmetic for a worth
– the shop row's own `changePct` is where a family's number lives, and it is already on screen.

⚠ **Idempotent without a persisted flag**, and therefore without a schema move: it reads the ledger
back for its own opening words at this week, which is `academySpokeThisWeek`'s trick.

### 14g. ⚠ AND `householdWeekly` NOW MOVES, which is his to feel

The shelf line on the Money screen is «one more week of holding, signed». It used to be a trickle a
positive rate could never make negative; on a $120,000 fund it is now hundreds of dollars a week and
**the sign flips**. That is the honest figure, and the split it feeds (`Math.max(0, shelfCents)` into
income, `Math.max(0, -shelfCents)` into outgoings) needed no change – it was always signed.

⚠ **It does not jitter.** The market's fastest anchor is HALF A SEASON and the interpolation is
smoothstep, which is flat at both ends, so the figure walks a curve rather than stepping when a
quarter turns over. Measured on a real career: **fewer than 20 sign changes in 260 weeks**, against
120+ for a per-week draw. Both writers of a worth – `revalueAssets` and `householdWeekly` – go
through `assetWorthCents`, so the till and the meter cannot describe two different markets; that is
round 29 #11's own defect, re-armed as a mutation and caught.

### 14h. ⚙ THE CRASH LAYER – his extension, same day, and the bound it re-prices

On being shown §14c's one-in-five negative seasons:

> «Каждый пятый сезон отрицательный – круто, но может быть нам добавить вариативность тоже здесь, а
> не рельсы? например раз в 3-5 лет и стартовый сезон уже может быть как раз с -20%? это добавит
> невероятной динамики и реализма.»

**The construction** (`world/market.ts`, THE CRASH LAYER block): one crisis per 208-week epoch,
starting at `epoch·208 + jitter` with jitter in [0, 104) – so gaps between crises are 2–6 years,
triangular, **centered on exactly four**, with **75.2% inside his 3–5 band** (16,000 crises
measured). Depth is drawn in his band verbatim – trough multiplier in [0.70, 0.85], **median
−22.5%** – over a sharp fall (8–16 weeks) and a slower recovery arc (40–80 weeks): the 2008/2020
shape. An arc is at most 96 weeks against a minimum gap of 104, so **crises never overlap and never
cross an epoch boundary**, which is what keeps the worst case a closed form. Four draws off
`${seed}:market:crash:${epoch}` in a fixed, documented order – read, never drawn, so `rngMain`
cannot see it, a reload replays the same crisis, and input-independence is untouched (the same
ticked-world proof arms cover it).

**No grace period, by his ask**: epoch 0's crisis starts inside the first two seasons, and **49.7%
of careers see a fall in season one**. The named fixture is his anchor made real:
`r29p3-crash-12`'s starting season nets **exactly −20%** and the feed says
*«A season of the market – a crash year: An index fund is down 20% over the season.»* – the crash
year has its own sentence, and a wave-only bad year stays plain (the label is the FALL, never mere
red).

⚠⚠ **THE BOUND, RE-DERIVED – it is now TWO-TIER, and the ten-year tail is his to accept:**

* **Calm waters – the old guarantee stands verbatim.** A crisis arc always returns home, so a hold
  whose basis and sell weeks both lie outside arcs sees exactly the wave-only bound
  (`worstCrashFreeRatio`): ten-year universality at vol < 1,824 bps, unchanged.
* **Selling into a trough – universality needs ~20 years.** The total floor is
  `e^(−2·vol) · 0.70 = 0.488` (`worstMarketRatio`), and `1.07^T · 0.488 > 1.0317^T` only past
  T ≈ 19.7 years – longer than a career. Universality at ten years is arithmetically impossible at
  his crash depths; that is not a tuning miss, it is what a real crisis costs.

⚙ **MEASURED** (`npx vite-node tools/market-probe.ts --seeds 4000`, crash layer in – 228,000
seasons, 48,000 holdings per horizon):

| | 1y | 3y | 5y | 10y |
| --- | ---: | ---: | ---: | ---: |
| fund beats the deposit | 57.15% | 84.03% | 86.75% | **98.90%** |
| losers selling in calm waters | 6,681 | 2,693 | 245 | **0** |

**⚠⚠ At ten years, 529 of 48,000 holdings (1.10%) lose to the deposit – and every single one sells
inside a crash arc.** Zero calm-water losers at ten years is the measured receipt of tier one. So
«мы ни за что не наказываем» now reads: **holding through a crisis costs nothing – only selling into
one can lose, at 1.10%**. That tail is REAL and it is HIS to accept as the price of «невероятной
динамики и реализма»; if he wants it gone, the knobs are the depth floor (shallower crises) or an
epilogue-style rule, not a silent re-tune here.

**The other consequence he sees plainly**: negative seasons rise from 19.9% (wave alone, the number
he called «круто») to **30.8%** – nearly one in three. His crises are the whole difference. If he
wants back toward one-in-four WITH crashes, the wave's `volBps` comes down (e.g. ~1,300) – his call,
one knob. Worst observed season is now **−39.9%** (a deep crash landing on an already-bad wave
year), worst peak-to-trough −40.1%.

**Knobs** (all in `world/market.ts`): `CRASH_EPOCH_WEEKS`/`CRASH_JITTER_WEEKS` (the calendar),
`CRASH_DEPTH_RANGE` (his −15…−30 band; `[0]` is also the floor the safety bound is built from – move
them together or the closed form lies), `CRASH_FALL_WEEKS`/`CRASH_RECOVERY_WEEKS` (the shape; keep
fall + recovery ≤ 104 or arcs overlap and the one-crash-at-a-time theorem dies).

### 14i. ⚙ UNITS, AND THE VOLATILITY COMING DOWN – round 30 #14 (30.08), his ruling on §14 as played

He played the market §14 shipped and ruled on it the next day:

> «Волатильность индексного фонда какая-то очень большая по ощущениям **+65/-15** это то, что я
> видел… Во-первых она скорее всего будет менее "галопирующая", во-вторых вряд-ли в таких крайностях.
> И надо логику фонда переделать на **покупку ДОЛЕЙ в фонде**, как раз доли дадут возможность расти
> на горизонте и будут давать **разные точки входа, как в жизни**. Стоимость активов будет
> рассчитываться исходя из стоимости долей. Зашёл, когда доля стоила 4к, через десять лет она может
> вполне удвоиться. Или зашёл на пике при цене 7-8к и увидел просадку на следующий год – **имеешь
> возможность усредниться или зафиксировать убыток**.»

**Two changes, and they are independent**: the model becomes a unit price with holdings measured in
units, and the wave's volatility is halved. §14a–§14h stand as the record of what they replace.

#### The model, whole

```
price(seed, week, rung) = unitBaseCents · (1 + annualRateBps/10⁴)^(week/52) · index(seed, week, volBps)
units bought           = paidCents / price(seed, THIS week, rung)
worth                  = round(units · price(seed, now, rung))
```

The **drift moved into the price**, and that is the whole structural change. §14 valued a holding as
`basis × (1+r)^(years since the basis week) × index(now)/index(basisWeek)` – three numbers that all
had to be restated every time money moved, which is what the rebase was. On the price instead, a
holding is `units × price(now)`: one multiplication, no basis, no per-row clock.

⚠ **It is the SAME PATH re-expressed, not a second model.** `price(t)/price(f)` is exactly the old
`(1+r)^((t−f)/52) × index(t)/index(f)`, so a single-entry holding is worth the same cents it was
worth yesterday and every §14 measurement still describes this path. The probe confirms it: rerun at
`volBps 1_800` the unit model reads **30.9%** negative seasons and a **−39.3%** worst season against
§14h's 30.8% / −39.9%.

#### What shipped

`ShopItem.unitBaseCents` (deposit **$1,000**, index fund **$4,000** – his own anchor), `unitPriceCents`
and `avgUnitPriceCents` in `world/assets.ts`, `OwnedAsset.units`, three fields on `ShopRowView`
(`unitPriceCents` / `unitsHeld` / `avgUnitPriceCents`), two lines on the Money screen's shop row, and
**`SAVE_SCHEMA_VERSION` stays at 66** – the units back-fill amends the unshipped v66 step, on the same
ground the P1 yacht rename did (main is at 65, so no v66 save exists outside this wave).

**Deleted**: `OwnedAsset.basisCents`, the rebase in `buyAsset` and in `sellAsset`, `marketRatio` in
`world/market.ts`, and `assetValueCents`' fourth argument. `basisWeek` survives with ONE meaning and
ONE writer – §3f's commissioned order, whose value clock starts on delivery.

⭐ **Every `stake: 'open'` rung is unit-priced, the deposit included** – his own expectation from
round 29 #11 («предполагаю, что Savings deposit будет вести себя так же»). It costs the deposit
nothing: with no `volBps` its unit price is `1000 × 1.0317^years` dead flat, and `units × price` is
identically the `(basis + top-up) × (1+r)^t` the rebase computed. **Rebasing at today's worth WAS the
unit model, written the long way round** – which is why it never produced a wrong number, and why
what it cost was not accuracy but MEMORY: it destroyed the entry price in the act of adding to it.

#### 14i-1. ⭐⭐⭐ What the player can now DO, which is the point

| | round 29 | round 30 #14 |
| --- | --- | --- |
| add money | basis restated, entry price destroyed | more units at today's price, both entries kept |
| the screen says | worth now, paid, ±% | ...and **units held · the price they averaged at · today's price** |
| average down | a feeling | a move: buy while the price is under your average, and watch the average fall |
| take a loss | a feeling | a move: sell part at today's price – the realised loss goes to the ledger and **the average does not move**, so the next decision is the same decision |

The average is `paidCents / units`, so a part sale takes the same fraction out of the cash and out of
the units and leaves it exactly where it was. Realising the oldest units first would move it by an
accident of ordering and nothing on screen could explain the new number.

#### 14i-2. The volatility: `volBps` **1_800 → 900**, and his crash band untouched

§14h already named this knob and this direction: «If he wants back toward one-in-four WITH crashes,
the wave's `volBps` comes down – his call, one knob.» **Halved**, because «half the wobble» is a
sentence that can be defended later and 1,050 is not.

⚠⚠ **`CRASH_DEPTH_RANGE` IS NOT TOUCHED.** −15…−30% at the trough, one crisis per 2–6 years, no grace
period: those are **his own numbers from the day before**, and shaving them is his call to make, not
mine to make quietly. What that leaves is named in 14i-4.

⚙ **MEASURED**, `npx vite-node tools/market-probe.ts --seeds 4000` (30.08) – 228,000 rolling seasons,
48,000 holdings per horizon, 16,000 crises, the same sample shape §14h used:

| | round 29 (vol 1,800) | **round 30 (vol 900)** |
| --- | ---: | ---: |
| seasons negative | 30.8% | **24.5%** |
| season sd | 16.79% | **15.06%** |
| season p5 / p95 | −18.3% / +38.9% | **−16.8% / +36.6%** |
| worst season | −39.9% | **−32.5%** |
| worst peak-to-trough drawdown | −40.1% | **−33.6%** |
| beats the 3.17% deposit – 1y | 57.15% | **62.04%** |
| – 3y | 84.03% | **90.23%** |
| – 5y | 86.75% | **87.89%** |
| – 10y | 98.90% | **99.67%** |
| crisis interval / depth | 4.01y, 75.2% in band, median −22.5% | **unchanged – his numbers** |
| a career whose first season sees a fall | 49.7% | **unchanged** |

#### 14i-3. ⚠⚠ THE SAFETY PROPERTY, RE-DERIVED – and the tail is **better**, not worse

«Мы ни за что не наказываем» is house law, so this is derived rather than inherited.

**The closed form, both tiers, at the new volatility:**

* **Calm waters** – `worstCrashFreeRatio(900) = e^−0.18 = 0.8353`. Ten years:
  `1.07¹⁰ × 0.8353 = 1.643 > 1.0317¹⁰ = 1.366`. **The ten-year guarantee holds for every seed and
  every entry week**, with a far wider margin than 1,800 gave – the §14c ceiling is 1,824 bps and
  coming down can only widen it.
* **Selling into the deepest trough** – `worstMarketRatio(900) = 0.8353 × 0.70 = 0.5847`, and
  `1.07^T × 0.5847 > 1.0317^T` solves at **T ≈ 14.7 years** (round 29: 19.7). Still longer than a
  ten-year hold, so the tail is still real – and it is a third of what it was.

⭐⭐ **AND UNITS DO NOT CHANGE THE ARITHMETIC OF A SINGLE ENTRY, which is why the bound carries.**
`units × price(t) = M × price(t)/price(f)` is the old expression exactly. A MULTI-entry holding is
`Σ Mᵢ · price(t)/price(fᵢ)` – a sum of terms each of which satisfies the bound at its own horizon, so
the whole beats the deposit whenever every tranche does. ⚠ That is **strictly safer than the rebase**,
which pulled the WHOLE holding onto the newest clock: under round 29 a top-up in season nine made a
season-one holding a one-year hold; under units only the new money is on the new clock.

⚙ **MEASURED, the number to put in front of him** – 48,000 ten-year holdings, 4,000 seeds × 12 entry
weeks, exactly §14h's sample:

> **156 of 48,000 lose to the deposit at ten years – 0.325%**, against round 29's measured **1.10%
> (529 of 48,000)** which he accepted. **Zero of them sold in calm waters** (round 29: also zero), so
> tier one's receipt is intact and every single loser is a trough-sell.

At five years the calm-water losers go **245 → 0** and at three years **2,693 → 99**. So the law now
reads: *holding through a crisis costs nothing – the arc comes home – and only selling into one can
lose, at 0.325% over ten years.* **He accepted 1.10%; this is a third of it and nothing about the
shape of the promise changed.**

#### 14i-4. ⚠ WHAT IS STILL HIS TO RULE ON – the +65% he actually quoted

He named **+65/−15** as what he saw. The −15 end is comfortably inside the new distribution (p5 is
−16.8%). **The +65 end is not**: the best season in 228,000 is **+69.2%**, and **0.56% of seasons are
over +50%** (round 29: 1.51%). Cut by two thirds, not removed.

⚠ **Those seasons are CRASH REBOUNDS, not the wave**, so the wave's knob cannot delete them: a
recovery arc is 40–80 weeks, so a season that starts at a trough can catch a whole rebound out of a
−30% hole, and `1/0.70 × 1.07` is already +53% before the wave adds anything. Two knobs would remove
it and **both are his**, because both change numbers he gave:

1. `CRASH_DEPTH_RANGE` shallower than his «-15…-30%» – a −20% floor puts the best rebound season near
   +40%, which is about a real index's best year.
2. `CRASH_RECOVERY_WEEKS` longer than 40–80, so no single season can hold a whole rebound. ⚠ Bounded:
   `fall + recovery ≤ 104` or crises overlap and the one-crash-at-a-time theorem – and the closed form
   above with it – dies. `[60, 88]` is the most that fits.

Say which, and it is one constant either way.

#### 14i-5. The migration, and what a save keeps

A v65 row is converted at **the price of its own basis week** – `units = (basisCents ?? paidCents) /
price(seed, basisWeek ?? boughtWeek, rung)` – so `units × price(now)` is the number the old model
would have shown this week, to the rounding. **A career's history survives the change rather than
being reset**; resetting to today's price would have destroyed the entry price in the act of
introducing it.

⚠ One consequence, named so it is not read as a defect: a v65 rebase folded accrued GAIN into
`basisCents`, so on a topped-up row the printed average (`paidCents / units`) comes out **below every
unit price that career ever saw**. That is correct – cost basis over units is what a broker's
«average price» means, and a family in profit is under today's price by construction.

⚠ A **fixed** rung is not touched: no `units` key, no market, valued off what was paid exactly as
before. `tests/round30-fund-units.test.ts`, `tests/component/round30-fund-units-screen.test.ts` and
the re-aimed round 29 guards carry all of it; the frozen MAIN capture (41550 / `e6b0c709`) and the
three frozen career hashes are **unmoved, re-derived per key against a control tree** rather than
inherited.
