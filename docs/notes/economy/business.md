---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The business block

The comment essays that stood above the `business` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `business.merch.famePivot`

```ts
      /** ⭐⭐⭐ ROUND 30 #23 – THE PIVOT OF THE CONVEX INCOME CURVE, in fame points:
       *      weekly = perFamePointCents x fame² / famePivot
       *
       *  THE OWNER: «проанализировать и скорректировать доход мерча». Measured
       *  (docs/research/player-brands-and-what-they-are-worth.md §7e), the linear dial paid $91.9k a
       *  year at the median career's peak fame and $156k at fame 100, against a researched band of
       *  **$0.5M–$2M a year NET** for a top full own-brand (§7d, derived from Sugarpova's $20M peak
       *  valuation and EleVen's $5–12M turnover through §5.4's multiples) – 3–13x under.
       *
       *  ⚠⚠ AND THE SHAPE IS FORCED, NOT CHOSEN. The BOTTOM of the old curve measured true: at the
       *  fame a family holds the week it can first afford the brand it yielded 6.0% a year against
       *  the index fund's 7%, which is this block's own anchor confirmed live. A flat multiplier
       *  would have broken the end that was right to fix the end that was wrong. Hold the anchor,
       *  reach the band, and the only curves left are convex; this is the simplest member, pivoted on
       *  the anchor itself so it is IDENTICAL at fame 10 by construction (fame²/10 = fame there) and
       *  diverges only above it.
       *
       *  ⚠ TEN IS THE ANCHOR'S OWN FAME AND NOT A FREE PARAMETER. Moving it moves the day-one
       *  economics of the rung, which round 30 #9's multiple was sized against. */
```

## `business.merch.value`

```ts
      /** ⭐⭐⭐ ROUND 30 #23/#24 – WHAT THE CAREER ADDS TO THE BRAND'S MULTIPLE. The arithmetic is
       *  `world/brand.ts`; this is its ladder.
       *
       *  THE OWNER: «У нас есть её профессионализм, сколько играет, сколько выигрывает, как глубоко
       *  проходит и вся остальная информация… Всё это можно использовать в расчете так или иначе.»
       *  The four rungs below are that sentence, in his order, each read off a record the save
       *  already keeps and never prunes – no schema move, no new field, a fold over history.
       *
       *  ⚠⚠ THEY MOVE THE WORTH AND NOT THE INCOME, WHICH IS THE POINT OF THEM. Before round 30 #23
       *  the brand's worth was `16 x a year of its income` and the two were ONE dial – nothing could
       *  reach one without moving the other in exactly the same proportion, which is why #23 stalled.
       *  Income is CURRENT FORM (fame, which falls); this is the ACCUMULATED CAREER, which is finding
       *  §5.1 of the research verbatim – «brand value follows the accumulated stock, not current
       *  form». Two careers at identical fame are now worth different money.
       *
       *  ⚠ AND NOTHING HERE IS SUBTRACTED. Every rung is a non-negative addition over a base, so a
       *  short career, a losing season and an unranked year cost nothing – «мы ни за что не
       *  наказываем» read against a valuation.
       *
       *  ⚠⚠ ROUND 32 #3 (31.08) AMENDED THE PARAGRAPH ABOVE AND IT IS NAMED HERE RATHER THAN QUIETLY
       *  LEFT WRONG. «They move the worth and not the income» is still true of these four rungs. What
       *  is no longer true is «the multiple is the accumulated career and fame does not appear in it»:
       *  the BASE the four rungs sit on is now a ramp in fame (`unknownX` below), on the owner's
       *  ruling «главное, чтобы эта известность участвовала в механизме». So the four rungs are a
       *  PREMIUM ON TOP of what the brand's own size already earns, which is what they were always
       *  described as and were not. Two consequences, both deliberate and both measured in
       *  docs/specs/brand-multiple-follows-fame-2026-08.md: a title is now priced in the multiple as
       *  well as in the income (§3), and the multiple can FALL (§6). */
```

## `business.merch.value.unknownX`

```ts
        /** ⭐⭐⭐ ROUND 32 #3, 31.08 – THE MULTIPLE A BRAND NOBODY HAS HEARD OF EARNS, and the bottom
         *  of the fame ramp that replaced the flat base. The arithmetic is `world/brand.ts`.
         *
         *  THE OWNER, on his own w933 career – fame 22.3, the brand taking $1,720 a week and priced
         *  at $1.63M: «личный бренд в цене подрос с 250к до 1.8м, а доход у него 1800 в неделю =)))
         *  что как-будто бы не очень соответствует стоимости.» And his ruling on the repair: «её
         *  известность 22.3 – да, это ок, главное, чтобы **эта известность участвовала в механизме**,
         *  тогда мы увидим разницу на других карьерах.»
         *
         *  ⚠⚠ THE DEFECT WAS THAT `earningsMultipleX` WAS THE WHOLE BASE AT EVERY FAME. Every term of
         *  the ladder below reads her TENNIS CAREER and none read the brand, so an unknown's brand
         *  traded at 14x and a fourteen-season veteran earned 18.23x on a business turning over $89k
         *  a year. Real multiples rise with the SIZE of the business, and the size of this business
         *  is her fame.
         *
         *  ⭐⭐ THE RAMP RUNS FROM HERE TO THE RUNG'S OWN `earningsMultipleX` AT `ECONOMY.fame.cap`,
         *  so at fame 100 the multiple is EXACTLY what it was before this change for every career –
         *  the ceiling is not cut, which is his other standing ruling («вроде бы как раз спонсорские
         *  коллаборации со спортсменами дают и не такое, кратно большее»). Only the bottom moves.
         *
         *  ⚠⚠ 2.5 IS THE HIGHEST VALUE THAT STILL READS SINGLE DIGITS AT THE FAME HE ASKED ABOUT, and
         *  it is chosen that way ON PURPOSE: every point of it is a point of the day-one anchor round
         *  30 #9 measured, so the setting is the LEAST aggressive one that answers him. At 2.5 his
         *  w933 row reads 9.30x and $832k; at 4 it reads 10.5x, which the shop rounds to «11 years»
         *  and does not answer him at all. It also sits inside the two-to-five band a firm earning
         *  $89k a year changes hands at. The frontier, and what it costs the day-one anchor, is
         *  measured in docs/specs/brand-multiple-follows-fame-2026-08.md §4. */
```

## `business.merch.value.finalX`

```ts
        /** ⭐⭐ «как глубоко проходит» – per professional final REACHED AND LOST (`TierTrophies
         *  .finals`, every tier `fame.titleFloor` names). ⚠ Round 30 #24 established that there is
         *  no ledger below a final, which is true and which is why a quarter-final cannot count; it
         *  does not stop a FINAL counting, and the fame floor reads `finals` only at 'slam', so every
         *  lost final from w15 to wta1000 is a dated professional result nothing in this game has
         *  ever read. Titles are deliberately NOT here – they are already fully priced into the
         *  income through fame, and pricing them twice is the one-dial defect wearing a new hat.
         *
         *  ⚠⚠ ROUND 34 #17 (03.09) – AND NOW THE FINALS ARE IN THE INCOME TOO (`fame.finalFloorShare`),
         *  so the sentence above no longer separates them. THE TERM STAYS, deliberately, on the
         *  measurement: with both live the owner's week-569 multiple reads 6.20x – inside the 6–9x
         *  corridor round 32 repaired the free float to – and holding this term out drops the brand's
         *  worth to $90,614 against the $104,044 he approved. The approved figure was measured with
         *  this term live, so the approved figure is the ruling. */
```

## `business.merch.value.maxX`

```ts
        /** the ceiling on the whole multiple, base included. ⚠ IT BINDS THE TOP OF THE SHELF: at
         *  fame 100 the convex curve pays $1.56M a year, so this is what decides whether the best
         *  career in a run exits at the RF mark's ~$27M or somewhere absurd. Sized in
         *  docs/specs/brand-worth-and-income-2026-08.md against the researched valuations rather
         *  than picked.
         *
         *  ⚠⚠ ROUND 32 #3 – AND IT IS NO LONGER WHAT HOLDS THE TOP, WHICH IS THE MEASUREMENT THAT
         *  WAVE WAS ASKED FOR. With the base a ramp in fame, worth goes as fame³ until this binds,
         *  and it binds at fame ≈ 92 for a career maxed on all four rungs and NEVER for a typical
         *  one. What holds the top instead is the ramp's own endpoint: it reaches the rung's
         *  `earningsMultipleX` exactly at `ECONOMY.fame.cap`, so at fame 100 the multiple is
         *  identical to the pre-round-32 one for every career, cap or no cap. The crossover and the
         *  proof are docs/specs/brand-multiple-follows-fame-2026-08.md §5. */
```

## `business.merch.crowd`

```ts
      /** ⭐⭐⭐ ROUND 30 #23, 30.08 – THE ROOM SHE PLAYS IN. Its own block, and the arithmetic is
       *  `world/brand.ts`' `brandCrowdMult`.
       *
       *  THE OWNER, overruling the `[GAP]` this wave had filed on the crowd: «у нас есть понимание
       *  коридора зрителей на каждом турнире, мне кажется этого достаточно вполне.»
       *
       *  ⚠⚠ THE CORRIDOR, NEVER THE DRAW. `season/preview.ts`' `eventCrowd` is a per-event roll and
       *  stays decorative – its grep guard in tests/preview.test.ts is untouched and still passes.
       *  What the brand reads is `tierCrowdMid`, the static table under it, so a valuation stays a
       *  fold over history with zero draws.
       *
       *  ⚠ IT MULTIPLIES THE INCOME, CENTRED ON 1, AND IS BOUNDED BOTH WAYS – it can tilt what the
       *  brand earns and can never carry it. Sized so the median career reads ≈1.00 the week it can
       *  first afford the brand, which is what keeps round 30 #9's day-one anchor where it was.
       *  Measured in docs/specs/brand-worth-and-income-2026-08.md §5. */
```

## `business.merch.strength`

```ts
      /** ⭐⭐⭐ ROUND 32 #4 (31.08) – THE BRAND'S SECOND, SLOWER STOCK. `world/brandStrength.ts` is
       *  the arithmetic and docs/specs/brand-inertia-2026-08.md is why.
       *
       *  THE OWNER: «А еще интересно, что будет происходить с годами падения в таблице (как у нее
       *  сейчас) – известность тоже будет падать и стоимость бренда, соответственно?» – and, on
       *  being shown the answer: «Инерция бренда – звучит интересно, давай попробуем».
       *
       *  ⚠⚠ THE MEASUREMENT THAT FORCED IT, off his own week-933 career projected five years with
       *  nothing won: $831,382 -> $9,098, a 99% capital loss. The cause is arithmetic and not
       *  tuning – fame halves every 104 weeks, the income goes as fame² and since round 32 #3 the
       *  multiple rises with fame too, so the WORTH goes as fame³ and falls eightfold every two
       *  years. A brand is not a live reading of attention: once built it holds a name, a shelf, a
       *  distribution and a customer who already owns two of its shirts.
       *
       *  ⭐⭐ SO INCOME AND WORTH READ DIFFERENT CLOCKS. Income is a FLOW and keeps reading fame –
       *  this year's noise really does sell this year's shirts. Worth is a STOCK and reads STRENGTH:
       *  the best she has ever been, faded on a half-life measured in YEARS and never falling below
       *  a share of that best. HIS RULING, both halves: «падает, но с полураспадом в годах, плюс пол
       *  в доле от пика – чтобы карьера, которая реально была большой, никогда не оценивалась по
       *  минимуму. – да» ⚠ The floor is HER OWN peak and not a global mark: a big career never
       *  prices at the minimum, a small one still can. */
```

## `business.merch.strength.retention`

```ts
        /** ⭐⭐⭐ REVISION (31.08) – HOW MUCH OF THE STOCK STILL SELLS SHIRTS, 0..1. THE OWNER, reading
         *  the first shipped result and stopping it: «меня смущает вот это: На пятом году бренд
         *  стоит $166 060 при годовом доходе $1 352».
         *
         *  ⚠⚠ HE IS RIGHT AND THE FAULT WAS THE SPEC'S. The first pass floored the WORTH and left
         *  the INCOME a bare function of fame, so the income still fell 98.7% over five years while
         *  the valuation held – 123x annual earnings, which is not a valuation. THE MEMORY WAS IN
         *  THE WRONG PLACE: the premise was always that a brand keeps «a name, a shelf, a
         *  distribution and a customer who already owns two of its shirts», and that customer keeps
         *  BUYING when she stops winning. So it is the REVENUE that must not collapse; a stable
         *  valuation is the consequence and not a second thing to install.
         *
         *      effectiveReach = max(fame, retention x strength)
         *
         *  ⭐⭐ THE TOP IS PRESERVED BY CONSTRUCTION AND NOT BY A CLAMP, and this constant being
         *  STRICTLY BELOW 1 is the whole of that proof: strength equals fame at the cap and at every
         *  running peak, so `retention x strength < fame` there and the reach IS fame – the income
         *  curve at the top is the pre-wave one term for term. The floor can only ever bind on the
         *  way down, which is the only place he asked anything to move.
         *
         *  ⚠⚠ AND THE SIZE IS MEASURED AGAINST THE ONE DOCUMENTED CASE THIS REPO HOLDS OF AN
         *  OFF-COURT INCOME WHEN THE WINNING STOPS: Naomi Osaka, ~$60M (2021) -> $12.0M (2024),
         *  −75% in three years WITH ESSENTIALLY NO SPONSORS LOST – «the fall is playing time»
         *  (docs/research/player-brands-and-what-they-are-worth.md §4e). The income goes as reach²,
         *  so a −75% three-year fall is a reach holding half of itself, and this is the value that
         *  lands there on his own row. Before the revision that same three-year fall was −92%.
         *  ⚠ It is a BOUND drawn from one case and not a law; the frontier either side of it is in
         *  docs/specs/brand-inertia-2026-08.md §18, and moving it is a decision about how much of a
         *  business survives its founder's silence rather than a correction. */
        /** ⚠⚠ ROUND 38 #2c RAISED THIS 0.78 -> 0.95, AND IT IS THE DIAL THAT MAKES THE OTHERS WORK.
         *  Measured: at 0.78 the stock floors the reach at 78% of the best she has been, so lifting
         *  her FAME (the season ladder above) simply pushed her back OFF the floor and onto the fast
         *  title clock – the level rose and the SLOPE GOT WORSE, -27.2% a season becoming -33.8%. At
         *  0.95 the stock binds again and the tail is governed by the stock's own six-year clock,
         *  which is what «более плавным» asks for: -23.3%.
         *  ⚠ IT STAYS BELOW 1 AND THAT IS LOAD-BEARING – see this block's own header: `retention < 1`
         *  is the entire proof that the top of the shelf cannot move, and the measurement confirms it
         *  (his two peak careers read the same worth to the cent at 0.78, 0.85, 0.90 and 0.95). */
```

## `business.merch.contracts`

```ts
      /** ⭐⭐⭐ ROUND 34 #17 (03.09) – THE BRAND FOLLOWS THE CONTRACTS. Approved by the owner:
       *  **+1 point of reach per $50,000 of LIVE annual contract value, the contribution capped at
       *  +30.**
       *
       *  ⚠⚠ THE INCOHERENCE IT ENDS, MEASURED ON HIS OWN WEEK-569 SAVE. The sponsor market prices
       *  her at $550,000 a year of live deals (and priced her at $1,000,000 a year through weeks
       *  404–452, her fullest shelf), while the brand model said her whole brand was worth $76,822
       *  and paid $244 a week: her brand was worth less than one of her own contracts for one year.
       *  His words: «плюс есть мощные рекламные контракты… мне кажется нам надо улучшить формулу
       *  рассчета доходности и стоимости ее бренда».
       *
       *  ⚠⚠ A SIGNAL INTO REACH, NEVER A CASH TRANSFER, and that distinction is the whole safety of
       *  it. The sponsor money already arrives through the deals themselves (`bankSponsorCheque` at
       *  signature, `payAdAnniversaries` each year); adding it to the brand's INCOME as well would
       *  pay her twice for one contract. What it says instead is that a house paying her seven
       *  figures has decided she is worth being seen with – which is a fact about how many people
       *  know her name, i.e. about reach, and the existing curve does the rest.
       *
       *  ⭐⭐ THE CAP IS THE POINT AND IS NOT DROPPABLE. Contracts lift the floor under an unglamorous
       *  professional – the whole complaint – but an icon is still made by titles and not by her
       *  agent. A top-10 shelf is worth $9.2M a year, saturates this term nearly twenty times over
       *  and has to win the rest.
       *
       *  ⚠ AND THE TOTAL IS STILL CLAMPED AT `ECONOMY.fame.cap` where it is spent (`brandReachOf`),
       *  so the top of the shelf that round 32 #3 fixed by construction cannot move. This lifts the
       *  middle and the bottom, which is where he was standing. */
```

## `business.academy.stageIncomeCents`

```ts
      /** ⭐⭐ WHAT EACH DELIVERED STAGE BRINGS IN AT REPUTATION 1.0, in cents a week, keyed by the
       *  catalogue's own stage ids. THE SHAPE IS THE ROUND-29 REACHABILITY PROPOSAL'S OWN TABLE
       *  (the ledger, part three): the land is a field and earns nothing; the courts rent; the
       *  clubhouse lodges; the staff run the programmes that are the business. One number reaches
       *  the ledger per week – the Nadal split (programmes+lodging 56%, its own sponsors 14%,
       *  merch, restaurants – Forbes España 2023) is the flavour of the LINE, never four lines.
       *
       *  ⚠ SIZED A QUARTER ABOVE THE PROPOSAL'S $5,750 BASE ($7,250), AND MEASURED BEFORE IT WAS
       *  KEPT (docs/specs/merch-and-academy-income-2026-08.md, predicted vs measured): the
       *  proposal's own sizing was «repay the p90 commission in 7 seasons at the cap»; the P7
       *  bench criterion is the research's bridge – the $12M academy repays in roughly 5–10
       *  seasons of a real reign. Benched at 108 × 780 (--buy-business): the careers that BUILD
       *  it hold reputation 2.40–4.00 with the MEDIAN BUILDER AT THE 4.00 CAP, where this base
       *  repays in **8.0 seasons** ($1.508M/yr) – mid-window – against 10.06 at the unlifted
       *  anchor (the window's edge); the worst builder (2.40) reads 13.3. At reputation 1.0 it is
       *  3.1% a year against the fund's 7% – the shelf's own law («assets never beat a career,
       *  they only survive one») still holds everywhere below a top-ten reign. */
```

## `business.academy.reputationBands`

```ts
      /** ⭐ REPUTATION – the fold over `seasonHistory[].byTrack.wta.endRank` the round-29 ledger
       *  proposed and P2 ruled («чем выше и дольше место – тем выше будет доход»): 1.0 base, plus
       *  the BEST band of each finished season, counted once per season, capped below. A season
       *  with no recorded WTA end-rank (pre-v46 rows, null ranks) counts nothing – «not recorded»
       *  is not «top-100». */
      /** ⭐⭐⭐ ROUND 34 #17 (03.09) – THE LADDER REACHES BELOW THE TOP 100. Approved by the owner:
       *  top-150 +0.05, top-250 +0.025.
       *
       *  ⚠⚠ WHAT IT ENDS, measured on his own save: eleven seasons, eight of them carrying a WTA
       *  end-rank – #349, #177, #95, #92, #89, #93, #97, #113 – and the only rung that paid anything
       *  was top-100, five times, for 0.50 in total. Six consecutive seasons inside the world top 115
       *  and three of them recorded NOTHING, because #113 and #177 were below the lowest rung there
       *  was. ⭐ That is the case for the two new rungs in one line: a career can hold the top 150
       *  for a decade and the model can barely see it. */
```

## `business.academy.reputationCapBase`

```ts
      /** ⭐⭐⭐ ROUND 34 #17 (03.09) – THE CAP GROWS WITH THE CAREER instead of the flat 4-for-ever it
       *  was: `reputationCapBase + reputationCapPerSeason x professional seasons played`. Approved
       *  by the owner at 4 + 0.5 – «so a long professional career is worth something and a short one
       *  is not».
       *
       *  ⚠⚠ AND THE MEASURED CONSEQUENCE IS THAT IT STOPS BINDING AT EVERY REALISTIC CAREER LENGTH,
       *  which is reported rather than adjusted (the figures are his). The bands can add at most 0.6
       *  a season, so the ceiling only catches the ladder when 1 + 0.6n > 4 + 0.5n, i.e. past THIRTY
       *  professional seasons. A twenty-season career spent entirely in the world top 10 – already
       *  far beyond anything the engine produces – reaches 13.0 against a cap of 14.0 and never
       *  touches it. What holds the academy's reputation now is the band ladder itself.
       *
       *  ⚠ AND IT MOVES THE P7 PAYBACK WINDOW. `academy.stageIncomeCents` was sized so the $12M
       *  academy repays in 5–10 seasons AT THE CAP; that window is the reputation band 3.18–6.37, and
       *  a long elite career can now stand above it (rep 6.4 needs nine top-10 seasons). Recorded in
       *  docs/rounds/round-34.md under item 17 for his eye – not compensated for here. */
```

## `business.academy.premiumPerRep`

```ts
      /** ⭐⭐⭐ ROUND 38 #8 (07.09) – HOW MUCH ONE POINT OF REPUTATION ADDS TO WHAT THE ACADEMY IS
       *  WORTH, as a share of the drifted price. `worth = paid x (1+300bps)^years x (1 +
       *  premiumPerRep x (reputation − 1))`. Option C, which the owner approved out loud: «хорошо
       *  звучит».
       *
       *  ⚠⚠ IT STARTS AT EXACTLY ZERO AND THAT IS THE DESIGN, not a coincidence of the number.
       *  Reputation is 1.0 for every career that has not banked a season (`academyReputationOf`),
       *  so the premium is `0.15 x 0` on the day the shelf opens and the paid price times the drift
       *  is a FLOOR. See `academyPremiumX` for why the clamp under it is written down anyway.
       *
       *  ⭐⭐ WHY 0.15, AND IT IS A BAND FROM THE RESEARCH RATHER THAN A FEELING. The two published
       *  player-academy/brand transactions this repo has found are the Nadal academy at ~31x
       *  earnings and Beckham's DRJB at ~10.9x (docs/research/player-brands-and-what-they-are-worth.md
       *  §5.4) – a going concern on real property trades ABOVE its bricks, and the question this
       *  number answers is by how much. ⚠ MEASURED ON HIS OWN WEEK-1115 CAREER rather than argued
       *  (`npx vite-node tools/r38-academy-worth.ts`): at reputation 2.825 it prices his two stages
       *  at $6,890,384 against $5,409,526 of drifted bricks – a **+27.37% premium**, so the going
       *  concern is a bit over a quarter of the row and the land and the courts are the rest of it.
       *  The alternative measured at the same time was option B, earnings x a multiple, which read
       *  $1.4M against $5.0M paid and was refused for saying an academy is worth less than its own
       *  land.
       *
       *  ⚠ AND IT DOES NOT COMPOUND. This is a LEVEL on the drifted price, not a second rate: an
       *  academy at a steady reputation gains 3% a year and no more, which is what keeps «assets
       *  never beat a career, they only survive one» true of the dearest thing on the shelf. What
       *  moves the premium is her seasons – so the career pays for it, which is the whole of option
       *  C. ⚠ At the reputation cap a long elite career can reach (8.2 on twelve top-10 seasons) the
       *  premium is +108%; the academy doubles, over a career that spent twelve years in the world
       *  top ten to do it. */
```
