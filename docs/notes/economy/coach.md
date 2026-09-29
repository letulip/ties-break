---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The coach block

The comment essays that stood above the `coach` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `coach`

```ts
  // --- THE COACH LADDER (docs/specs/coach-tiers.md; the model itself is engine/coach.ts) --------
  //
  // REPLACES `expenseRangeCents` – the old two-band weekly draw (hired $250-700, parent $120-400).
  // The bands become a per-tier PER-HOUR ladder, a ROSTER of named coaches is drawn off it, and the
  // weekly bill is `coach rate x hours(plan) x wealthCorridor[background]`.
  //
  // ⚠ THE CORRIDOR IS BACK ON COACHING (Round 2, owner 29.07), and the reason is his, not mine. I
  // took it off arguing that the tier already says "poorer families buy cheaper coaches", so keeping
  // both charges the difference twice. His model is better and it is a DIFFERENT claim:
  //
  //   «для 8к все тиры [в их академии] стоят согласно их коридору, для 25к – свои цены,
  //    для 120к [в их премиальных и элитных местах] стоят дороже всего»
  //
  // The corridor is not a discount for being poor, it is THE MARKET SHE TRAINS IN. The same rung of
  // coach costs different money in a working-class club, an ordinary academy and a premium one,
  // because the court, the city and the queue for that coach's time are different. A family does not
  // get a cheaper Middle coach because it is poor - it hires the Middle coach its academy HAS. So
  // every tier is priced in every corridor, both dials are real, and the wealthy family pays MORE
  // for the same rung, which the previous model had backwards.
  //
  // THE DRAW COUNT IS STILL ONE pickInt per tick, in the same position. What it draws changed: the
  // COACH's rate is his own and comes off the roster sub-stream, so the main-stream draw is now the
  // week's jitter (see weekJitterBps). Corridor and hours are post-draw multiplies.
```

## `coach.sessionsByTrain`

```ts
    // SESSIONS A WEEK, anchored on the three plan PRESETS. ⚠ 4 / 5 / 6, the owner's own numbers
    // (Round 2), replacing the 3/4/6 I anchored on his price table's "x4 h/wk" reference. An hour
    // is a session.
    //
    // THE HALF THE OLD MODEL WAS MISSING: the split scaled the development rate and, through
    // planFactor, barely scaled the bill (0.91 at train 60 to 1.06 at 85 - a 16% spread on a slider
    // that doubles her growth). Hours are what a coach charges for, so the split now moves the bill
    // by half again end to end and the family has two dials instead of none: WHICH coach, and HOW
    // MUCH of him. A High coach at four sessions is affordable where an Elite at six is not.
    //
    // Anchors rather than two endpoints because train 75 sits at t=0.6 of the 60-85 range, not at
    // its middle, so a straight line puts BALANCED somewhere nobody chose. Linear between anchors,
    // clamped outside them, ascending by construction.
```

## `coach.hourlyRateCents`

```ts
    // THE OWNER'S PRICE RESEARCH (29.07), per hour, individual lessons, big-city rate, converted
    // straight across because per-hour is the unit he priced in. His midpoints, row by row:
    //   12-16   Budget 30 · Middle 50 · High  80 · Elite 120
    //   17-22   Budget 35 · Middle 60 · High 100 · Elite 160
    //   23+     Budget 40 · Middle 65 · High 120 · Elite 200
    //
    // ⚠ THESE ARE MIDDLE-CORRIDOR PRICES. The corridor multiplies them, and middle's is [0.95, 1.05]
    // centred on 1.0, so his table IS what an ordinary academy charges - which is the market he
    // priced. Working pays 0.7-0.8 of it and wealthy 1.2-1.3, per the rung, per the hour.
    //
    // Each band is his midpoint +/-20%, and a coach's OWN rate is drawn from it once and kept for
    // the career (see the roster below). So the band is no longer weekly breathing - it is the
    // spread of rates between the coaches who work at that rung, which is what makes a tier a
    // market with a price range rather than a single number.
    //
    // SELF IS THE COURT, NOT THE COACH. The parent's hour is free - that is the whole rung - but the
    // court is not, and §3 of the spec keeps every tier price inclusive of it rather than splitting
    // court rental into a line of its own (we already charge it for practice matches). So `self` is
    // priced at exactly the court rental §3 quotes, $10-30/h, and takes the MIDDLE of that band: it
    // has no roster and nobody to be dearer than. A $0 rung would hand the working family the single
    // largest line in the game.
    // ⭐⭐⭐ THE ELITE ROW IS THE OWNER'S SHELF AND IT IS HIS TABLE × 1.25 (round 41, 12.09, after P1:
    // «единая элит-полка вверх - верно»). P1 took the corridor off `high` and `elite` – one price for
    // everybody – and the measured consequence was that a wealthy family's idle year stopped burning
    // (+$6,280 -> -$4,917 on the 16-seed batch, 70% of it the corridor fade). Of the two levers the
    // calibration put in front of him – the wealthy INCOME or this band – he picked this one, and he
    // picked the direction: UP, to a single shelf.
    //
    // THE ARITHMETIC IS NOT A TUNING, IT IS AN IDENTITY: the new uniform price is what the WEALTHY
    // family paid under the corridor P1 retired, so the row is his own 29.07 midpoints times
    // `WEALTH_CORRIDOR.wealthy`'s midpoint, `(1.2 + 1.3) / 2 = 1.25`, to the dollar -
    //   12-16  $120 -> $150/h     17-22  $160 -> $200/h     23+  $200 -> $250/h
    // - and at the balanced plan's five sessions that is a weekly shelf of $750 / $1,000 / $1,250 for
    // EVERY background. docs/specs/one-market-2026-09.md §3's resolution block carries the table and
    // the predicted-vs-measured; `tests/economyCalibration.ts`'s `BANDS` block carries the burn.
    //
    // ⚠ `high` IS DELIBERATELY NOT HERE. His word was «элит», and P1's own «по крайней мере» note
    // already records that widening the cut was a floor rather than a bound - widening the PRICE is a
    // second decision and he did not make it.
    //
    // ⚠ ZERO RNG. `pickInt` spends exactly one `rng()` call whatever its bounds, so a wider band moves
    // the cents a coach charges and never a position on `seed:coaches`; the corridor roll still lands
    // on exactly 1.0 at this rung. Every elite rate scales monotonically, so `bestFitCoachAt`'s
    // cheapest-among-equals tie-break hires the same man at the same seed.
```

## `coach.retainerBandByRank`

```ts
    // =============================================================================================
    // ⭐⭐⭐ ROUND 42 #19 – THE RETAINER FOLLOWS HER RANK. Proposals; the predicted-vs-measured table
    // is docs/specs/elite-retainer-2026-09.md.
    // =============================================================================================
    //
    // THE OWNER: «элитный стоит 830 в неделю, это 43к в год… за такие деньги их не существует», and
    // then the commission: «у нас есть исследование и бенч, надо просто цифры проверить и
    // актуализировать». His research (docs/research/team-economics-2026-09.md §1) prices a head
    // coach in two parts, and until this round only one of them was sized by anything: a retainer
    // read off the TIER the parent chose and her AGE band, plus a prize share. Reality sizes the
    // retainer off THE PLAYER'S RANK - top-100 ≈ $90k/yr, top-10 $150-250k - and re-prices the SAME
    // man as she climbs. Ours never did, which is finding 3.1 in one sentence.
    //
    // ⚠⚠ THE WHOLE POINT OF A RANK GATE IS THAT IT CANNOT REACH THE MIDDLE. Finding 3.2 is explicit
    // that mid-careers are priced right and that a blanket staff raise «would bankrupt the mid game
    // the tiers ladder was built to save». A factor read off her live W ranking is 1.0 for every
    // career that never enters the professional top hundred, so the middle is not measured to be
    // unmoved - it is ARITHMETICALLY unmoved, `x * 1` on an integer, on every week of every career.
    // The bench proves it anyway: a claim of «byte-identical» that nobody ran is exactly the null
    // arm CLAUDE.md warns about.
    //
    // ⚠ WHY HER RANK AND NOT HER EARNINGS, when 3.2's own complaint is denominated in money: the
    // research says rank in as many words («sized by the PLAYER'S RANK»), and a fee that tracked the
    // wallet would re-price the coach on the week a sponsor cheque landed, which is neither the
    // fiction nor anything a player could plan around. Measured, the two agree here anyway - a
    // season inside our top hundred banks a median $330k and a season inside our top ten $2.24M,
    // which is real top-tour scale (tools/r42-elite-retainer.ts §1).
    //
    // ⚠ THE BAND MULTIPLIES HIS LABOUR AND NEVER THE COURT (`bandedRateCents`). A top-ten player
    // does not make the hall dearer, and keeping the court out of it is also what lets the whole
    // change be one multiply on one number: `weeklyBillSplit`'s facility half is computed from
    // `facilityRateCents`, so the coach half absorbs the raise exactly and `coach + facility ===
    // total` survives untouched.
    //
    // ⚠ STEPS AND NOT A RAMP, deliberately. The research's own shape is a band table, and 3.1 asks
    // for «renegotiation as a scene, not a slider» - a step is the thing a scene can be hung on
    // later. What ships here is the arithmetic; the scene is its own item.
    //
    // ⚠ READ TOP-DOWN, FIRST MATCH WINS, so the rows stay ordered tightest-first. Anything outside
    // the last row is 1.0 - the identity, and the reason a career below the tail is byte-identical
    // rather than merely close.
```

## `coach.raise`

```ts
    // =============================================================================================
    // ⭐⭐⭐ ROUND 42 #51 / ROUND 44 – THE ANNUAL ASK. docs/specs/the-coachs-raise-2026-09.md.
    // =============================================================================================
    //
    // THE OWNER NAMED THE CORRIDOR AND THE CEILING HIMSELF (16.09, #51): «Коридор 5-15%, ceiling =
    // the rank band». What he did NOT want is the trigger the first draft gave it: «может такое
    // быть, что всего с 1 титулом в сезон (например w250/w500) тренер будет требовать 15%? Кажется,
    // что самого факта такого единственного титула маловато, нужна какая-то общая оценка прогресса».
    // So the position INSIDE the corridor is a weighted progress score and a title is one of its
    // four components rather than its trigger.
    //
    // ⭐⭐ AND THE BAND ABOVE BECOMES THE CEILING, WHICH IS THE SCENE ITS OWN COMMENT DEFERRED. Round
    // 42 #19 shipped `retainerBandByRank` as an arithmetic re-price and said so in as many words:
    // «3.1 asks for "renegotiation as a scene, not a slider" - a step is the thing a scene can be
    // hung on later. What ships here is the arithmetic; the scene is its own item.» This is that
    // item. The band no longer moves a fee that is already agreed - it says how far an AGREED fee may
    // be asked upward, and a man already on the payroll can never be priced above what the market
    // would quote for him at her standing today.
    //
    // ⚠ WHICH IS ALSO THE SAFETY PROPERTY, and it is worth stating as one because it is what makes a
    // live-save migration harmless: the stored fee is `min(agreed x (1 + ask)^n, today's market
    // labour)`, so it can NEVER exceed what this same till was charging before the change. The fix
    // can lower a family's payroll and cannot raise it.
    //
    // ⚠ THE WEIGHTS ARE THE ONLY FITTED NUMBERS HERE, and every REFERENCE the four components divide
    // by is a figure the game already states out loud (the rank halving, the coach's own quoted
    // season band, the tier ladder's own length, `ECONOMY.form.max`). That is deliberate: a component
    // with a private normaliser is a dial nobody can argue with, and four of those would have made
    // the score untunable. The measured corridor against his 5-15% is in the spec's §4.
```

## `coach.courtTierFactor`

```ts
    // THE VENUE, BY THE RUNG THAT TRAINS THERE (docs/specs/court-follows-the-coach-2026-08.md).
    //
    // ⚠ UNTIL 08.08 THE COURT TOOK NO RUNG ARGUMENT AT ALL, so an Elite coach worked on the same
    // court as a self-coaching parent. The owner priced the real thing himself, from the sport he
    // plays:
    //
    //   «у нас есть корты за 22 доллара в час (кстати, теннисные стоят похожих денег) и за 44+
    //    доллара в час в других местах, есть и дороже всякие элитные корты»
    //
    // ⚠⚠ AND THE OWNER RULED ON THE SHAPE THE SAME DAY, which is why this is a ladder and not the
    // two-step at the top it shipped as for an hour:
    //
    //   «Можно вообще стоимость корта по тиру к тиру тренера привязывать и всё.
    //    Более дорогой тренер = более дорогой корт.»
    //
    // So the court rises with the RUNG, every rung, and that is the whole rule. Multiplies
    // `facilityRateCents`, which is the middle of the `self` band - so at 12-16, middle corridor, the
    // court runs $20 / $20 / $24 / $38 / $48 an hour. x2.4 inside one corridor, x4.46 from the cheapest
    // court in the game to the dearest, against a measured x1.86 before and a real single-city spread
    // of x5.1 (Sydney, one municipal operator) to x16.7 (New York, $15 public clay to $250 indoor).
    //
    // ⚠ `budget` IS THE ONE CELL HIS RULE CANNOT REACH, and it is arithmetic rather than an oversight.
    // A Budget coach's whole bill is $30/h at 12-16 and $20 of it is already the court, so his labour
    // is $10 at the midpoint and $4 at the bottom of his own band. Lifting his court to the owner's
    // own $22 club figure would leave the cheapest Budget coach in the game **$2/h** - below every
    // published coaching rate on Earth, and it would deepen the finding that
    // docs/research/real-coaching-costs.md §7.3 already reports about that corner. The club court is
    // therefore shared by `self` and `budget`, and the fiction is exact: a club coach uses the club's
    // courts, which are the same courts the parent books for herself.
    //
    // ⚠ IT IS A PARTITION AND NOT A RE-PRICE. `hourlyRateCents` is untouched, so `split.totalCents`
    // is the same integer on every week of every career and no survival number can move - measured,
    // 1,620 careers, 538 bankrupt before and after. What changes is which half of the bill the family
    // is looking at.
    //
    // ⚠ THE THREE CHEAP RUNGS ARE 1.0 ON PURPOSE, and it is the one thing here that is NOT a
    // compromise. docs/research/real-coaching-costs.md §7 records that our cheap end was already
    // right and that the owner confirmed it twice without meaning to: his 29.07 research put a Budget
    // coach at $30/h, and his 08.08 figures put the court at $22 and Budget labour at "from $10" -
    // $32, two independent statements 7% apart, with our $20 + $10 = $30 between them. Re-pricing
    // there would be manufacturing a correction.
    //
    // ⚠ WHY `middle` IS 1.2 AND CANNOT BE MORE. Its midpoint total is $50/h, so ANY court above $25/h
    // makes the room the larger half of an ordinary academy's bill and inverts the composition the
    // whole ladder is built on (tests/split-the-bill.test.ts holds Budget court-dominated and
    // everything above it coach-dominated). The hard ceiling is x1.25; 1.2 is the largest step that
    // clears it without landing on the line, and it leaves $26 of coach against $24 of court.
    //
    // ⚠ AND WHY `high` IS 1.9 RATHER THAN THE 2.0 HIS "$44 vs $22" IMPLIES: at 2.0 its court is
    // EXACTLY half its $80 bill, and `coachCents > facilityCents` inverts on a rounding. 1.9 leaves
    // $42 of coach against $38 of court. The other binding constraint is that every rung's band LOW
    // must stay above its own court or a coach drawn at the bottom of his rung books a $0 coach line:
    // high $64/$80/$96 against $38.00/$41.80/$45.60 and elite $96/$128/$160 against
    // $48.00/$52.80/$57.60, per age row. Both are asserted, not assumed.
    //
    // ⚠ THE CORNER WHERE THE TWO AXES MEET, checked because it is the one cell two multipliers can turn
    // into nonsense: ELITE x WEALTHY. At the corridor's ceiling that is $62.40/h at 12-16 and $74.88/h
    // at 23+. Against real premium court hire it is comfortably inside - Roosevelt Island Racquet Club,
    // New York, indoor clay, weekday prime: $132 member / $250 non-member; Hall of Fame Newport grass
    // $250/h; Islington indoor GBP 40 non-member. The corridor and the rung are different axes (the
    // market she trains in, and the venue that market's coaches work at), and at their product the
    // model still sits below the dearest courts anyone actually publishes.
    //
    // THE EMPIRICAL CASE, because "it looks wrong" is not one: a published SINGLE-VENUE coach ladder
    // is only x1.13-1.43 wide (Central Park NYC, Meadows, Oak Hollow, Duke, Pure Tennis, Crawley
    // LTC) and the LTA's own certification ladder is x1.91 - while OUR rung ladder is x4.0. So our
    // four rungs are not four colleagues at one club, they are four VENUES, and a court price
    // identical across them is the thing that does not survive contact with the evidence. One
    // venue's own court card shows how far it should move: Pure Tennis Academy, Wexford PA, $22
    // member / $44 non-prime / $60 prime = x2.7 - to the dollar, the owner's own two numbers.
```

## `coach.weekJitterBps`

```ts
    // THE WEEK'S JITTER, in basis points, and the ONE main-stream draw the bill spends. A coach has
    // a rate; a WEEK still varies - a session moved, a court booked at a worse hour, an extra half
    // hour before a tournament. +/-8% keeps the bill recognisably his price while leaving the
    // Money screen something to show.
    //
    // ⚠ THIS LINE USED TO END "and it is what preserves the frozen MAIN capture: exactly one pickInt,
    // in exactly the slot the old expense draw held" - WHICH OVERSTATED THE RULE AND WAS CORRECTED ON
    // 08.08. CLAUDE.md invariant 2 is explicit that the capture is "a documented measurement, not a
    // change-gate since v35" and that "a wave that legitimately adds a MAIN draw updates the pin";
    // the pin has already moved three times (45239 -> 51642 -> 41550). What IS permanent is
    // input-independence and the sub-stream rule, and neither of those is about the draw COUNT.
    //
    // ⚠ WHICH LEAVES THE JITTER OWING A REASON OF ITS OWN, because the sentence above records that
    // the roll became jitter partly to keep a slot - provenance, not merit. The merit it should stand
    // or fall on: a real weekly bill is not the same number 52 times, and at +/-8% it is small enough
    // that the rung stays recognisable in the figure and large enough that the family notices the
    // week. The owner has been asked to accept or reject that on its own terms
    // (docs/specs/split-the-bill-2026-08.md §6); removing it is a one-line change costing one MAIN
    // draw and a re-pinned capture, and it is HIS call rather than a thing to inherit by accident.
```

## `coach.roster`

```ts
    // THE ROSTER (Round 2). «примерно по 4 тренера на тир, по одному на стиль игры» - what makes
    // screen T a market rather than a menu: at one rung the parent chooses between a coach who fits
    // her game and one who does not, at roughly the same money.
    //
    // The slots are DATA and not a generated grid, because the art is: 16 portraits ship in
    // public/images/coaches (budget 3, middle 5, high 4, elite 4), each of a specific person, so the
    // gender is a fact about the file and the style is a reading of what he is doing in it. What the
    // seed draws is the NAME; who these people are does not change between careers.
    //
    // ⚠ THE OWNER REVERSED "BUDGET SHIPS NO SERVE-FIRST COACH" (playtest, 30.07): «2 counterpancher
    // budget, none big serve». Both halves of that sentence are one complaint, and it is the poorest
    // family's complaint - the only rung a working-class career can actually shop at was the one rung
    // with a hole in it.
    //
    // WHAT THE RULE USED TO SAY, kept because the argument was real and lost anyway: a big serve is
    // the expensive build, the cheap rung teaches shape and consistency, and a serve-first girl who
    // shopped at the bottom found nobody who fitted her. That was described as "the tier's texture",
    // and Round 2 was explicit that the owner had not objected to it.
    //
    // HE HAS NOW, AND HE IS RIGHT, for a reason the texture argument never answered: a play style is
    // chosen ONCE, on screen R, before the player has any idea what coaching costs - and it is
    // persisted for the whole career. So "serve-first has no great fit at Budget" is not a texture, it
    // is a fourteen-year-old's irreversible choice quietly taxing the family least able to buy its
    // way out. The other three styles each had a great-fit Budget coach who was also the cheapest
    // great fit IN THE GAME (R3 pinned exactly that); serve-first alone had to find $41/h at Middle
    // against $28 at Budget. The texture was only ever visible to a serve-first family, and to them it
    // read as the game being broken.
    //
    // ⚠ AND IT COSTS THE R3 DUPLICATE, DELIBERATELY. Round 3 moved `middle-4` down from Middle (which
    // carried two counterpunchers purely because five middle portraits had to go somewhere) and argued
    // the duplicate now "reads as something rather than as an accident: the club IS defence and
    // consistency, so two defensive coaches at the bottom of the market is what a club looks like",
    // giving a counterpuncher two Budget prices to choose between. That reading was fair and it is
    // what the owner has just called the bug. It is also the CHEAPER of the two things to give up:
    // a counterpuncher losing a second Budget price loses a choice between two coaches who fit her,
    // while a serve-first girl was losing the only coach who could fit her at all. `budget-1` keeps
    // the counterpuncher slot - he is the Home card's face for the working-class family and the
    // cheapest great-fit counterpuncher in the game, which is the fact R3 pinned in answer to the
    // owner's PREVIOUS complaint, and reversing that would re-open a closed issue.
    //
    // WHAT SURVIVES INTACT is the structural half of R3, which is the half the owner asked for:
    // FOUR A TIER, all the way up. The roster is now one coach per style per rung, sixteen slots,
    // no duplicate anywhere - the most even spread this art can produce.
    //
    // The portrait stem still says `middle-4` because a stem names the MASTER FILE, not the rung and
    // not the style - the art is a man in a cap and an orange jacket, both hands up, mid-explanation,
    // which is a man showing a serve motion as readily as a defensive shape. Renaming the file would
    // break every save holding that id, and the id is what a save holds.
```

## `coach.styleAffinity`

```ts
    // FIT, as screen T's three pills - and since Round 2 it is a fact about the COACH, not the tier.
    // A coach coaches the game he plays; how well that transfers to hers is a question about the two
    // STYLES, so this is a compatibility table and not a tier table.
    //
    // Symmetric, and the shape is the game's own: aggressive and serve-first are both first-strike
    // tennis and read across; counterpuncher is the opposite philosophy and does not; all-court is
    // the generalist and is never `off` for anybody, in either direction. Own style is always
    // `great`, anything unlisted is `off`.
```

## `coach.fitFactor`

```ts
    // ...and what a pill is worth on the development rate. WIDER than the rung ladder since round
    // 38 #17, not smaller: fit spans x1.67 (1.25/0.75) against x1.21 across the hireable rungs
    // (0.95 -> 1.15) and x1.40 across the whole ladder including the parent (0.82 -> 1.15). So the
    // pill REORDERS the market rather than breaking ties inside it, and in BOTH directions. A
    // Budget coach who is great for her (0.95 x 1.25 = 1.1875) out-teaches a Good-fit Elite coach
    // (1.15 x 1.00 = 1.15), so the match is now a reason NOT to buy up a rung; and an Off-style
    // coach on the bottom two rungs (0.7125, 0.78) teaches SLOWER than the parent's own 0.82 while
    // being billed every week for it. The second of those is the `under-self` band the coach card
    // prints; the first is the join that card cannot make, since it shows the two multiplicands
    // separately and multiplies them nowhere - see the profile lens in engine/world/coachMarket.ts.
    // All twelve cells are pinned in tests/wave5-coach-profiles.test.ts §A.
    /** ⭐⭐⭐ ROUND 38 #17 (07.09) – THE SPAN WIDENS 1.05/0.94 -> 1.25/0.75, AND IT IS THE HALF THAT
     *  MAKES THE THREE ROUTES DIFFERENT.
     *
     *  THE OWNER named three ways to reach the ceiling – «1. игрок тренирует сам и грамотно 2. она с
     *  тренером долгосрочно и у них метч 3. она с элитным тренером» – and then asked of the fit:
     *  «вопрос в том, как его показать?»
     *
     *  ⚠ THE ANSWER TO THAT QUESTION IS THAT IT ALREADY IS SHOWN. `CoachMarketScreen` prints «Great
     *  fit» / «Good fit» / «Off-style» and carries a lens for what a coach would be worth against
     *  another style. It does not FEEL like anything because the whole span was 12% – which is the
     *  real content of his question, and it is a number rather than a screen.
     *
     *  ⚠⚠ IT WIDENS THE SPREAD WHERE `plateauRate` NARROWS IT (see that constant's own table), which
     *  is why the two are one decision: a great fit is worth more to a career being run well, and an
     *  off-style partnership costs a mismatched one 93.2% against 98.9%. Measured with
     *  `tools/r38-ceiling-dials.ts`; the owner chose the pair. */
```

## `coach.eliteGate`

```ts
    // THE ELITE GATE - AND IT IS ON (owner, 13.09: «elite gate включим здесь же», wave 5 T13).
    // Owner, when it was built: «элит, кстати, могу вообще стать доступны для туров, как вариант и
    // стоит соответствующе». The idea is that an Elite coach does not take a fourteen-year-old with
    // nothing to show, which would turn the top rung from "what rich families buy in week 1" into
    // something earned - the same shape as the academy scholarship.
    //
    // He asked for it to be an OPTION first, so it was modelled and switched off, and this is the
    // flag being turned: the gate is live everywhere at once (the market's hireable check, the hire
    // command's refusal and the screen's locked row all read `coachHireable`). `minPoints` is her
    // EARNED ranking points, the same number the tier ladder gates on, and 150 is national-tier
    // eligibility - "she has results" stated in the currency the rest of the game already uses.
    //
    // ⚠ IT GATES THE HIRE, NOT THE HAVING - a latent seam, and it is named because it was CHECKED
    // rather than assumed. `coachHireable` is asked by `hireCoach`, by the market row's `lockedPoints`
    // and by the screen's lock: all three are surfaces of the HIRING DECISION. `openingCoachId` asks
    // nothing - it reads `bestFitCoachAt` and stops - so a career that OPENED on the elite rung would
    // keep its coach through the flip.
    //
    // ⭐ AND NO SHIPPED CAREER CAN: `OnboardingWizard`'s `COACH_OPTIONS` offers exactly two rungs,
    // `self` and `middle`, so the top rung has never been something a player could pick in week 1 -
    // which is why this is a seam and not a hole, and why T13 leaves it alone. The only trees that
    // reach it are `tools/econ-bench.ts`'s presets (a bench sets `coachTier` at birth) and a v22-or-
    // older save whose profile carried a rung this wizard does not offer. If the wizard ever grows an
    // Elite tile, this is the line that has to be read first - onboarding would need its own answer
    // (a refusal, a fallback rung, or the rung hidden until she has results), which is a second
    // mechanic and the owner's call, not this flag's.
    //
    // ⚠ DOMESTIC POINTS, since the two ladders landed. 150 is literally
    // TIERS.national.enterPointBand[0], so the domestic table is the one that keeps this number
    // meaning what it was written to mean. Do not repoint it at the ITF table without moving the
    // threshold too: an ITF gate would make the Elite rung reachable only by families who could
    // already afford to fly, which is the shape the gate exists to prevent.
```

## `coach.upliftHorizonWeeks`

```ts
    // WHAT A RUNG IS WORTH TO HER, RIGHT NOW - the projection screen T prints on every coach row.
    // Owner: «"budget может добавить 0-2%", "middle 1-3%", "high 2-4%" но всё зависит от ребенка».
    // COMPUTED, never written down (see coachSeasonUplift): a hand-written band drifts the moment a
    // knob moves, and the game already knows the answer. `weeks` is the horizon the projection runs
    // over - one season, because that is the unit a weekly bill is judged in.
    //
    // ⚠ THIS NUMBER WAS A HARD-CODED LITERAL 52 FOR ONE REASON, AND THE CYCLE THAT FORCED IT IS NOW
    // CLOSED (TB-02). economy.ts used to import `WEEKS_PER_YEAR` from season/calendar.ts while
    // calendar.ts imported `ECONOMY` straight back – a runtime cycle. This object is evaluated at
    // MODULE LOAD, so reading the calendar constant HERE threw "Cannot access 'WEEKS_PER_YEAR'
    // before initialization" in the browser's module order and took the whole app down with it.
    //
    // WHAT IT COST: nothing caught it. It does NOT throw under vitest, whose resolution order
    // differs, so the suite stayed green through the crash; it was found only by loading the real
    // app. The workaround was to write `52` here and confine the imported constant to FUNCTION
    // bodies, where the temporal dead zone has passed – a live landmine that a later edit moving
    // any calendar read up to module scope would have stepped on again.
    //
    // THE FIX IS THE DIRECTION, NOT THE PLACEMENT: the season length now comes from
    // `shared/dates.ts`, a leaf that imports nothing, so economy no longer depends on calendar at
    // all and calendar derives `WEEKS_PER_YEAR` from the same leaf. There is one 52 in the codebase
    // and no cycle to initialise around, which is why this may safely be a named constant again.
```
