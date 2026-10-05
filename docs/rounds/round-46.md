---
type: round
status: current
area: delivery
last-reviewed: 2026-10-05
---

# Round 46 – the owner's playtest after round 45 merged, 22 items (05.10)

He played the merged build (round/45 went in as PR #164 the same day). The list mixes asset-card
UI, the year-summary popup, life-event presentation (a wedding happened with NO screen), an index-fund
cost-basis defect, two dev tools he wants for debugging, and one architecture question (a micro-LLM
in the browser). Item 16 says a save is attached – **no attachment reached the architect's session**;
item 20 explains he currently cannot export saves at all, which 20 itself is meant to fix.

Status: `[x]` shipped on the branch · `[~]` answered, nothing to build · `[>]` in flight, agent named
· `[ ]` open · `[?]` waiting on the owner's answer · `[!]` REOPENED (was reported done, was not)

---

- [x] **1. «Когда выбрали залистить айтем на продажу появляется кнопка withdraw выше sell на карточке
  машин. Предлагаю в один ряд сделать, а ещё, если случился list, то sell заменять на sell now и
  жёлтую. На карточке домов кнопки лежат одна сверху другой. Надо проверить во всех разделах и
  сделать одинаково.»** – split:
  - **1a** – listed-item cards stack `withdraw` above `sell`; put the two in ONE ROW, and make the
    layout identical across EVERY asset section (cars, houses, and whatever else sells: check the
    whole market surface). Class: **build**.
    - **B7 · 1a SHIPPED.** Both buttons are now ONE row on every card that can list. The engine's own `listAsset` took six families
      (car, house, business – the merch brand –, boat, plane, and the academy lot; measured by listing one rung of each in one world), and
      all six render through the ONE `Card v-for` in `ShopPanel.vue` (`MoneyScreen` only hosts it): `git grep` over `src/` finds
      `withdrawListing` / `askSell` in `ShopPanel.vue` and `composables/shop.ts` alone, so no other screen draws a sell or withdraw control.
      The uniformity map is therefore one component, one row class (`.shop-stake-row.is-listed`) and one markup order (Withdraw, Sell now).
      **Cause – two symptoms of one thing:** Withdraw had a block of its own (`.shop-row-listing`) ABOVE the row. On the cars (`--art-left`)
      that block stacked in flow – «withdraw выше sell». On houses, boats and planes (`--art-right`) the existing rule
      `.shop-row--art-right .shop-action { position: absolute; right: 10px; bottom: 10px }` hits EVERY `.shop-action` in the card, so the two
      buttons were two absolute boxes on one spot: his «одна сверху другой» was literal. **Fix:** Withdraw moved into the one
      `.shop-stake-row` every owned card already draws (before Sell); the badge keeps its own line and no button lives in it any more. Each
      family keeps the pair WHERE ITS OWN SELL STOOD, so no earlier ruling about a corner moved: cars and academy at the bottom-right corner
      (`justify-content: flex-end` on the listed row, the lone pill's `margin-left: auto` cleared), houses/boats/planes on the painting as ONE
      absolute row (the row is absolute now, no longer each pill), the merch brand at the left of its row. **Unlisted cards are
      byte-identical:** the Sell button's own lines are untouched (`v-else` added) and `tests/component/principles-e11-shop-identity.test.ts`
      – golden `render.json` NOT re-recorded – is green. (A first shape, one button with an inline `{{ }}` label, moved the whitespace
      around the text node – ` Sell ` became `Sell` – and that golden caught it.)
      **Seen in a real browser** (the repo's `tb-endings` dev-server config, the real `MoneyScreen` and stylesheet fed an engine-built
      snapshot with all six families listed; scratch harness `tools/_b7_*`, deleted after): at 375px and at 360px every owned card of every
      family draws the pair on ONE line, 149px wide (Withdraw 74 + 6 + Sell now 69), overlapping no text; cars/academy 13px from the corner,
      painted families 11px. At 320px the pair wraps but stays right-aligned inside the card and nothing overflows. My first bound for the
      painted families (`50% - 20px`) fitted at 375px and WRAPPED at 360px, hence `50% - 12px`; the pills are 9px a side (a lone pill is
      12px) so that two of them fit the ~165px the painting leaves the controls. **Not looked at:** a real save, the stale state's two-line
      badge, a desktop-width card.
      Tests: `tests/component/round46-b7-sale-row.test.ts` (12) – the structure per family, data-driven over every family the engine lets
      list. ONE existing helper changed: `pressSell` in `secondary-market-s5.test.ts` now also finds `Sell now`, because the card's control
      reads that once listed (1b). Mutations, each restored byte for byte (`cmp` clean): Withdraw put back in the badge block → 6 red (one
      per family); `shop-action--sell-now` taken off → 1 red; the fill made `transparent` → 1 red.
  - **1b** – once an item is listed, the `sell` button becomes **`sell now`** and turns **yellow**
    (his own copy and colour – the wording is his ruling, verbatim). Class: **build**.
    - **B7 · 1b SHIPPED.** A listed card's Sell control reads `Sell now` and is yellow. The words are his, wired as given; the string is
      the EXISTING `SALE_LABELS.sellNow` (the popup's second door), so the verb has one spelling and there is no new constant – on screen it
      is in the app's sentence case, as he types `withdraw` and `sell` for the buttons that read `Withdraw` and `Sell`. His message is quoted
      on `shopSellRowNote` in `composables/shop.ts`; DRAFT row R46-S22. The predicate is `row.listing` – the engine's own, the one that
      already draws the badge – and nothing else: an unlisted card, a deposit and a fund read what they always read. Behaviour is untouched:
      the button is still `askSell`, which opens the market popup, and the popup already offers no List for an ad that is up (`Keep it` and
      `Sell now`). **Yellow:** the design system's own token – `background: var(--warning)` (an alias of `--amber`, #f5b942; its documented
      job is «this is a risk, and you may still take it», which an instant sale at the fire price is) with `color: var(--on-lime)`
      (#111a10, the app's ink for a bright fill). No new variable. **Contrast 10.09:1** (WCAG 2.1 relative luminance of those two tokens;
      AA needs 4.5). ⚠ The test reads the COMPILED SHEET and the root tokens and asserts the rule declares the two tokens; it does not use
      `getComputedStyle(button)`, because happy-dom does not match an SFC's scoped `[data-v-…]` selectors – measured: `color`, `background`
      and `border-color` all come back `''` on a plain `.shop-action` – so `assertLegible` there would pass on anything. Only the Sell
      control is yellow; Withdraw keeps the outlined pill.

- [ ] **2. «the weight дублирует the weight в настройках, надо второе переписать и может немного
  развернуть»** – two settings rows both read «the weight»; rewrite the SECOND one (he delegates the
  new wording – and «развернуть» = it may grow a few words of explanation). New string = DRAFT row
  for his blessing. Class: **build**.

- [ ] **3. «Похоже у нас такой же небольшой гринд на недвижимости есть: я только что продал первый
  дом за 332к, и мне предлагаю купить новый за 240к. На счёт инфляции на дома я ещё думаю, кстати,
  что ты думаешь на эту тему?»** – split:
  - **3a** – the housing grind: sell a house at 332k, be offered the next at 240k – the same class
    as round 45 #10 (the brand's 13,800). Measure the actual sell/offer spread and whether flipping
    houses is profitable grind. Class: **measure**.
  - **3b** – house-price inflation: he is still thinking and asks the architect's opinion. Class:
    **answer** (architect's recommendation, his decision).
  - **A0 · 3a MEASURED to the digit**: house-first `entryCents` $240k × 1.03¹² years × 0.97 resale
    basis ≈ **$332k – his number**; the catalogue's entry prices never move, so the same rung is
    re-offered at $240k and the churn pockets ~$92k per cycle, repeatable forever.
  - **OWNER RULED (05.10)**: «Дом на 3% в год - смотри, чтобы он всё ещё при этом остался инвест
    активом, пусть и небольшим, т.е. его рост должен обгонять инфляцию.» → entry prices index at
    **+2 %/yr, strictly below the family's +3 % appreciation**: a quick flip goes negative (−$2.7k
    at year 2), the 12-year churn shrinks to ~$28k (noise), the holder keeps beating the late
    buyer. Class: **build** → bundle **B14**.

- [ ] **4. «Альбом стал лучше, а давай ещё повернём немного вот этот цветной горизонтальный билет на
  на 5 градусов по часовой стрелке?»** – the coloured horizontal TICKET scrap in the album rotates
  +5° clockwise. Class: **build** (identify the exact scrap asset, rotate in the placement resolver,
  pin the value).

- [x] **5. «На 29й день рождения она просила свой счёт в банке - это смешно. Давай наверное сделаем,
  что она будет где-то в адекватном возрасте и обстоятельствах его спрашивать? Может жёстко к 18
  привязать, например. Или, если можно раньше, то в коридоре 16-18»** – the own-bank-account birthday
  ask fired at 29. Gate it to an adequate age: his preference = hard 18, or a 16–18 corridor if the
  beat can naturally fire earlier. Class: **build** (find why it fired at 29 first – the fix must name
  the cause, not just clamp).
  - **B8 · 5 SHIPPED – IT WAS THE REFILL LENDING A ROW, NOT A MISSING AGE TERM.** `bankcard` is a row of the 18 band and of no other, so it can
    reach any other card only by being LENT: round 42 #26's refill (`materialFor`) tops a short pool up from the neighbour bands, and a parent who
    grants every ask retires the late bands' rows until the walk reaches the 18 band for a row she was never given – the hand round 45 #9 found
    taking the deposit. It lands as the ASK because the career-scope ladder prefers the least-used row and an unasked row is the least used there is.
    Measured on the code as shipped (`tests/birthday-own-account.test.ts` (c), sixty seeds): 282 birthdays from 19 to 45 carried the account, and walked
    from fourteen with a parent who grants everything the first ask for it came at 33 on the first seed tried.
    **THE GATE** (`world/birthday.ts`, block over `OWN_ACCOUNT_ID`; three rules, none of them a draw): (1) never lent – `lendable` drops the row from every
    neighbour a short pool borrows from, which closes every other age in one filter (under sixteen included); (2) eighteen, whatever the balance, is the
    hard anchor – the row is the 18 card's own and the ask is overridden to it after the draw (the bicycle's and the deposit's shape); (3) sixteen or
    seventeen, once money has reached her own account (`world.kidFundsCents > 0`, the balance `ownAccountNote` already gates on), the row is swapped in
    for the card's last material row BEFORE the shuffle and is the ask. Once only: a row she was asked about or given is not asked again, and nothing lends it after.
    **HIS SAVE (29, no account) sees nothing** – the rule reads her age at the birthday and the row is lent to no card, so there is no migration and no state.
    The account itself is not tied to the gift: it is the kid-share ramp (`kidShare`, `ownAccountNote`, `ownAccountCard`), which never waited for a birthday,
    so the family loses only the ask. **RESIDUAL, FLAGGED:** a girl in college on her 18th birthday keeps the college card (the bicycle is its ask by his
    earlier ruling) and is asked at 16 or 17 if money had reached her, otherwise not at all.
    **Wording:** none of the row's strings moved (diff checked; the card carries the 18 band's own object, asserted by identity). **RNG:** MAIN gains no draw –
    `tests/condition.test.ts` 51 passed (frozen capture); the swap keeps the shuffle's permutation (exactly one slot differs, never the day).
    **Tests:** 10 new in `tests/birthday-own-account.test.ts` ((a) sixteen and seventeen, (b) never earning → eighteen, (c) walked 19–45 and 14–40, (d) the
    `again` line and object identity, the permutation pin, college outranks the anchor, the engine seam). Two band-18 replicas in `tests/birthday-ask.test.ts`
    RE-AIMED, not weakened (the ask only, the anchored case only). Birthday family green: 9 files, 191 tests. **MUTATED, each arm went red and was restored
    byte-identical (`cmp`):** drop the 18 anchor → 3 red ((b), the once-only walk, the seam); lend the row again → 2 red ((b) at 17, (c) 282).
    `vue-tsc -b --force` green.

- [x] **6. «Может для своей яхты тоже поставим -15% вероятности травмы?»** – «тоже» = something
  already grants −15% injury (find the existing owner of that bonus – presumably the own plane);
  mirror it for the OWN YACHT. Tuning change → measured, not guessed (invariant 5): bench arm or
  probe + spec note. Class: **build + measure**.
  - **B10 · BUILT (05.10), with ONE FLAG for the owner below.**
    **THE REFERENT HUNT** – «тоже» is **not the plane** (nothing on the plane touches the injury threshold: it cuts
    fares and adds a travelling-week bonus). It is the **Elite recovery programme**: `ECONOMY.vacation.packages[elite]
    .buffFactor` **0.85** (`economy/vacation.ts:95`; the resort is 0.9) → `resolveVacation` stores `world.recoveryBuff =
    {untilWeek: week + 4, factor}` (`world/planner.ts`) → `injuryTau` multiplies the weekly threshold by it, ONE post-draw
    multiply (`world/injury.ts:285`) – and the vacation sheet already **prints** it under the row, «injury risk −15% for
    4 weeks» (`PlanWeekSheet.vue`, `row.buffFactor < 1`). The own-yacht week (`yacht-week`) was the only top rung with
    `buffFactor: 1`, so what he sees is a line under Elite and none under the yacht. **Every injury multiplier today**
    (all post-draw on `injuryTau`, then `min(…, 0.12)`): base 0.003 + 0.00015 per fatigue point · age table · consecutive
    play [1, 1, 1.2, 1.5, 1.8] · playing week ×1.4 · booked vacation week ×0.25 · physio rung (budget 0.76, the rungs above
    lower) · recovery buff (resort 0.9, **elite 0.85**) · shoes (`kitInjuryFactor`) · knock push ×2.2 / ×3.0 · recurrence.
    **BUILT – the narrow reading of «своей»:** `grantedBuffFactor: 0.85` on the `yacht-week` row + ONE pure rule
    `vacationBuffFactor(pkg, grantedIds)` (`economy.ts`, beside `vacationPriceCents`), asked by BOTH `resolveVacation` (the
    booking) and the sheet's row (the parity class: one function, two surfaces). «Своя» is what the shelf already means by
    it (`grantedVacationIds`: a DELIVERED `yacht` / `yacht-big`, §13c), so the owner's FREE week carries −15% for the 4 weeks
    after it, down Elite's own pathway – the same `recoveryBuff`, the same single multiply, **zero new draws, no schema
    change**. The CHARTER keeps `buffFactor` 1 (§13g's «weaker after-effect») and every other package × grant pairing
    answers its shipped `buffFactor`, so a world with no delivered yacht is byte-identical to before. The choice, stated:
    the owner's own week only, not the charter – his word was «для СВОЕЙ яхты».
    **PREDICTED → MEASURED (invariant 5):** predicted tau × 0.85 on the four buffed weeks, hits −15% in expectation. The
    instrument is the compare itself – a played season diverges after the first injury either arm takes, so a full-tick
    count would measure the path, not the multiplier (and was not run). `tests/yacht-own-buff.test.ts` (d): 40 seeds × 1,040
    weeks of tired-end states, the real `resolveVacation` seam once per seed, the real first draw of `seed:injury:<week>`:
    **Σtau ratio 0.850000 (exact), hits 204 vs 235 → 0.868** (0.8 sampling errors off 0.85; the owner's hits are a subset
    of the charter's), max tau 0.0170 so the 0.12 cap never binds. Small in absolute terms: baseline ≈0.6 % a week on that
    sample, so a booked yacht week avoids ≈ 0.003 injuries.
    ⚠⚠ **FLAG – IT RETIRES §3f's VETO ON THE OWNER'S SIDE, and he should hear it once.** The spec's «the yacht must NOT be
    the strictly best rest week available» (the 26.08 spec's own reasoning, not an owner quote) held because Elite kept the
    injury buff, «a currency a boat cannot pay in». The owner's week is now **free · +48 · −15% for 4 weeks = Elite with the
    bill removed**: a family with a delivered yacht has no reason left to book Elite. The charter is untouched (1.4× Elite's
    price, no buff – still strictly worse). If he wants the veto back it is ONE knob: delete `grantedBuffFactor` and the
    helper answers `buffFactor` everywhere (byte-identical to before, which test (f) proves by doing exactly that). Spec:
    `docs/specs/the-shop-2026-08.md` §13h (+ dated pointers on §3f's item 4 and §13g) and a line under `vacation.packages[6]`
    in the notes.
    ⚠ **WORDING – none written; two EXISTING strings are newly reachable on the yacht row, both chosen by the live buff:**
    (1) the sheet's «injury risk −15% for 4 weeks» line now shows under the owner's yacht row (never under a charter);
    (2) the log's «…, and the recovery holds for 4 weeks.» template is selected by the buff actually live, so the owner's
    yacht-week log line carries it. No string was edited or added; the shop card's blurb is untouched (his to write if he
    wants the perk named there).
    **Tests:** `tests/yacht-own-buff.test.ts` 6 new – (a) the row, and the one rule over every package × grant pairing,
    (b)+(c) the real tick seam, owner vs charter on one seed: `recoveryBuff` {untilWeek: w+4, factor: 0.85} vs null,
    `injuryTau` = unbuffed × 0.85 to 1e-12, the charter's tau = the owner's unbuffed tau (ownership leaks through the buff
    and through nothing else), the log line follows the live buff, (e) a yacht owner booking Elite gets 0.85, the resort
    0.9, the seaside none, (f) **byte-identity with a positive control** – six non-owner worlds hash identically with and
    without the knob, the owner's yacht week hashes differently, (d) the measurement above.
    `tests/component/round29-shop-elite.test.ts` +1 mounted arm (the sheet's half: the owner's row shows the clinic's own
    injury line, a charter none, the clinic as the control so a line missing from both cannot compare equal);
    `tests/planner.test.ts`: one dated comment, no assertion touched. **Verdicts:** new file 6/6; component file 14/14;
    27 tracked test files name vacations, the planner, the economy module or the sheet – 26 ran in the unit project, 806
    tests green; the 27th, `tests/fatigue-bench.test.ts`, belongs to the sim project (not run – the PR step) and never
    mentions a yacht, an asset or the grant list; **frozen capture `tests/condition.test.ts` 51/51, EXIT 0** (zero draws,
    MAIN untouched); `pins:check` ok (my first draft of the component arm used a raw `slice(indexOf())` and the ratchet
    caught it – rewritten); `doc-facts` ok, `notes-pointers` 603 resolve; `vue-tsc -b --force` green on the final tree
    (sentinel read from its own log).
    **MUTATED, each arm went red and was restored byte-identical (`cmp`):** the helper drops the owner's factor → unit 3
    red + component 1 red; the booking ignores the helper → unit 2 red; the sheet reads the row → component 1 red; the
    multiplier at `injury.ts:285` dropped (`tau *= 1`) → unit 2 red; the grant check dropped (the buff leaks to the
    charter) → unit 3 red, including (f). Not looked at in a browser: the row needs a delivered-yacht career and the
    mounted test asserts the rendered text. `docs/decisions.md` is not touched (the owner-log entry and its index regen
    are the architect's).

- [ ] **7. «Выигранный 1000 снимает сейчас 12 кондишина, и кажется, что 500 снимает ощутимо больше.
  Проверь пожалуйста»** – under the 02.10 tariff (500/1000/Slam all = 3) a WON 1000 drains 12 and a
  WON 500 seems to drain MORE – an inversion if true. Probe both with the drain probe; if confirmed,
  diagnose (draw sizes? match counts? run ladder?) and propose. Class: **measure**, then his word or
  an obvious fix.
  - **A0 · MEASURED** (tools/condition-drain-probe.ts, no dice, SHIPPED column): net straight-sets
    title runs with the travelling masseur – 250:**12**, 500:**17**, 1000:**12** (his «12» to the
    digit), Slam:**14**. A won 500 outprices a Slam. Cause: the deep-draw run-ladder discount
    `[-2,-1,0]` (R64/R128 open at 3–4 per match against the 500's flat 5) compounding with the
    masseur's per-match tour relief.
  - **OWNER RULED (05.10)**: «по 7 надо сделать разумно, например: 250-12, 500-15, 1000-18,
    шлем-21… посчитай по нашей математике… в 1000 на 1 матч больше, чем в 500, а в шлеме на 2. Мне
    кажется это справедливая логика.» The computed shape that lands his four numbers EXACTLY: the
    run ladder for 500/1000/Slam becomes `[0,0,0,1,1,1,1]` (first three matches free of run
    surcharge, +1 from the fourth) and the deep-draw discount is DELETED; his 02.10 tier
    surcharges, the W15–250 ladder, juniors and domestic do not move a digit. Predicted nets
    12/15/18/21, spacing +3 per extra match (6 gross − 3 relief). Early exits at 1000/Slam rise
    3–4 → 5 per short visit (the discount's death – big sheets stop being cheap trips). Corridors
    (econ-reach, injury %, holiday bench) re-pin after the build, round-45 style. Class: **build**
    → bundle **B13**.

- [x] **8. «В попапе итогов года что-то странное с доход-расход, в расходы явно что-то лишнее
  попадает, а в доходах общее состояние и прирост не учитываются, надо исправить»** – the year-summary
  popup's income/expense split: something extra lands in expenses; income ignores net worth and its
  growth. Engine-UI parity class: find what the popup sums vs what the engine's own ledgers say.
  Class: **build**.
  - **B5 · 8 SHIPPED – IT WAS THE ENGINE'S SEASON FOLD, NOT THE CARD.** The popup printed what `maybeFireSeasonWrapUp` banked, and that
    was the wallet's GROSS fold: `lastSeasonSummary.spentCents/earnedCents` came off `financeWindow(world.financeWeeks, seasonStartWeek)`
    whole. It now banks consumption and income apart from what only MOVED, and shows the family's portfolio and its growth.
    **THE COMPOSITION, line by line.** Window = the ledger rows from the season's first week through the wrap week inclusive; a category
    is classified by its NET over the window.
    * BEFORE – «Spent» = the sum of every category that nets negative: coaching, facility, travel, entry, gear, stringing, tuition, physio,
      staff, vacation, practice, other **and `shop`** (a house, an academy stage, the brand, a fund deposit – money MOVED onto `world.assets` –
      plus the cars', boats' and planes' weekly upkeep, net of any sale or withdrawal proceeds). «Earned» = the sum of every category that
      nets positive: prize (the family's half – her share never enters the ledger), sponsor, academy, business, income, interest **and a
      positive `shop` net** (a year of sales read as INCOME).
    * AFTER – the same twelve consumption categories are «Spent», the same six income categories «Earned»; `shop` leaves BOTH and is its own
      signed figure (`wealth.shelfNetCents`). `fundsDeltaCents` – the wallet's change – is untouched, so `earned − spent + shelf = funds`
      closes to the cent (pinned).
    **(a) THE «ЛИШНЕЕ»:** the whole `shop` category – on his scenario class (a fund deposit that gained, a berth bill) $4.02M of a $5.02M «spent»
    against $1.0M of real consumption. **(b) WHAT THE INCOME SIDE IGNORED:** the family's overall worth and its growth. The ledger cannot say
    either – a fund's appreciation is written onto `valueCents` by `revalueAssets` and never booked, and a deposit is a transfer. Now
    `summary.wealth` carries the portfolio (wallet + holdings at worth = `careerMoney.portfolioCents`, the epilogue's «Family's portfolio»),
    the holdings, the shelf net, and the growth wrap to wrap – exactly one season, against the figure on LAST year's card (season 0 reads from
    the opening wallet). **No baseline means no growth row**: the first wrap after this ships on a career already under way shows the portfolio
    and no growth, rather than a guess.
    **ENGINE-WRONG vs POPUP-WRONG – ENGINE, LOUDLY.** `financeWindow` read whole is the wallet's meaning of «spent»; the 18.09 reckoning taught
    the CAREER totals the holding rule (`careerMoney`, `isHoldingCategory`) and left the season fold alone. The fix is a SECOND reading of the
    same window (`seasonMoneyOf`, `world/ledger.ts`) beside the untouched `financeWindow`; the wallet's own fold and the Money screen's «This
    season» donut (which still sums «The shop» as a slice – B7's file, not edited) stay gross, so spent + the shelf's outflow is the donut's
    centre to the cent. The history row banked beside the summary is fed by the same locals, so Money → History («what the year cost») now
    reads consumption too; rows banked earlier keep the gross figure they were written with (nothing can split the shelf back out of them –
    a mixed column across the update, flagged).
    ⚠ **PERSISTENCE, FLAGGED:** one OPTIONAL key (`wealth?`) on the banked `SeasonSummary` – the `rankTrack?` / `entryMirror?` precedent, NO
    schema bump. If the architect reads the v88 rule («two persisted keys are a schema move») as covering a summary key, it is a comment-only
    v92 step + `v92.json` + README row + e2e fixtures + the docs sentence + `PRE_V92`; not spent here, and v92 is a shared hot spot this round.
    ⚠ **UPKEEP:** it rides with the shelf (`resolveAssetUpkeep` books it under `shop`; ruling 5 of 18.09 says it is not tennis), so a family with
    a yacht and no purchase this year sees a «Holdings and upkeep» row – the ledger has no category of its own to split it out.
    **Tests** (18/18 new green; 452/452 over the 19 money / history / wrap-up / golden-save files; `vue-tsc -b --force` exit 0):
    `tests/round46-season-money.test.ts` (the composition table over all 19 categories as cost and as income; the excluded set is exactly
    `['shop']`; the identity; his scenario through `buyAsset` + the real `maybeFireSeasonWrapUp`; history parity; the chain and no-baseline; a
    shelf-less career is gross-identical; the M-form) and `tests/component/round46-season-summary-money.test.ts` (6 mounted arms).
    **MUTATED, each arm went red and was restored byte-identical (`cmp`):** the fold ignores the holding rule → 7 red; pre-fix gross banking
    (his scenario: «spent» $5.02M) → 4 red; any previous summary as baseline → 1 red; wealth rows always shown → 1 red; compact form off → 2 red;
    card uncapped → the phone arm red. DRAFT: R46-S12, R46-S13 (wired), R46-S14 (reused label, NOT new), R46-S15, R46-S16 (alternates).

- [x] **9. «А у нас где-то есть индикатор, что у неё есть отношения в данный момент? Может сделать
  что-то на личной странице или заменить after school, например, когда он станет неактуальным?
  С подсчётом сколько они уже вместе например или ещё что-то?»** – no current-relationship indicator
  exists(?); add one on the personal page – e.g. replace the stale «after school» block once it is no
  longer relevant, showing the partner and how long they have been together. He gave design latitude
  («или ещё что-то»). New strings = DRAFT rows. Class: **build**.
  - **B4 · 9 SHIPPED – a relationship line on her personal page, UNDER the tile grid beside the school and
    college sentences; the After-school cell is untouched.** While it stands: `Together with {name} for {span}`;
    once married: `Married to {name} – together for {span}`; while she has not given a name: `Together for {span}`
    (the engine writes the name at the engagement, so for most of a relationship there is none). The screen
    prints `snapshot.life.togetherNote` and derives nothing.
    **The «replace after school» call.** That cell does go quiet – its ladder ends at `Grown up` / `Her own life
    now` from 22 – but it cannot honestly host the line. A name plus `1 year and 6 months` does not fit a `nowrap`
    tile line (the reason the school and college sentences already sit under the grid), and the line has to stand
    while the cell is still current (a girl of 19 on `Tennis full-time`), so a swap would show it in two different
    places depending on her age. The owner's idea stays open as a later move; nothing here blocks it.
    **Laws kept.** It is the PARENT'S attachment – `knownPartner`, never `activeEpisode` – so a girl who has not
    told him shows nothing, and an ended one shows nothing. The span is B1's `relationshipDurationWeeks` in
    `togetherSpan`'s words (one count with the wedding card); «married» is `latchedEpisode`. Snapshot: ONE derived
    field, `life.togetherNote`, fed by an optional `together` fact on `KidLifeWorldView` (optional so the
    hand-built views in six test files need no edit); persisted nowhere, no schema move, zero draws.
    DRAFT: R46-S10 (wired), R46-S11 (alternate).
    **Tests** – `tests/component/round23-kid-page.test.ts`, extended (5 new arms, 10/10 green): standing and
    named, unnamed, married (and a nameless married row), nobody / ended / not told yet, the school cell reading the
    same beside the line, and the notes-stack wrap check. Every expected span is built from the real primitives
    off the same world, never typed. **Mutations**, each alone and restored byte for byte (`cmp`): span source set
    to 0 reddens the named and married arms; the paragraph removed reddens named, married, seat and phone; `married`
    forced false reddens the married arm alone; the fog gate dropped (`knownPartner(world, Infinity)`) reddens the
    not-told-yet arm alone. Also green: the 18 component files that mount KidScreen (202 tests) and 38 unit files
    around `kidLife`, the template rules, import cycles and the barrel pins (839 tests); `vue-tsc -b --force` clean.

- [x] **10. «На экране между матчами с большой картинкой немного съехала вёрстка в ширину и есть
  горизонтальный скрол, надо проверить и починить»** – the between-matches screen with the big
  picture overflows horizontally (horizontal scroll exists). Fix + a mounted no-overflow assertion at
  phone width. Class: **build**.
  - **B11 · 10 SHIPPED – ONE STALE NUMBER: THE FULL-BLEED CARD QUOTED THE OLD 24px GUTTER, AND THE SCROLLER HAD BEEN 16px SINCE R17 #8.**
    **THE SCREEN** – TournamentFlow's `pre` phase, the "Match Day" card between rounds: `MatchScene` with `fill` (the painted
    portrait `img.scene-art`, its scrim and the glass plate), placed by `.tf-scene.tf-scene`. The friendly's card (`PracticeFlow`,
    `.pf-scene`) is the same component but not `fill` and carries no negative margin (grep over `src/components`: the only `-24px`
    bleed is this one), so it cannot overshoot by this cause – read, not measured in the browser.
    **THE OFFENDER AND THE CAUSE** – `.tf-scene.tf-scene { margin: 0 -24px }` cancelled a gutter `.tf-body` no longer has: R17 #8
    moved it to `padding-inline: var(--app-pad-x)` (16px) and this margin kept the old figure. So the card, its `img` and its scrim
    were **16px wider than the screen (left −8, right +8)**; `.tf-body` is the takeover's own scroller, `.tf-fit` gives it
    `overflow-y: hidden`, which makes its `overflow-x` compute to `auto`, and it scrolled the 8px sideways; the glass plate and the
    round pill sat **4px from the edge where MatchScene gives them 12**. ⚠ `documentElement.scrollWidth` equalled the viewport at
    every width (the takeover is `position: fixed`), so a page-level "no horizontal scroll" check reads green over this bug –
    measure `.tf-body`.
    **MEASURED** in real Chromium on a production build (the e2e `careerAt('junior')` fixture -> splash -> Begin -> "Watch match" on
    screen), `.tf-body` scrollWidth / clientWidth. BEFORE: 320: 328/320 · 360: 368/360 · 375: 383/375 · 390: 398/390 · 430: 438/430
    (always +8, `maxScrollLeft` 8), scene box −8 … viewport+8, plate and pill 4px from the edge, three offenders (`div.scene`,
    `img.scene-art`, `span.scene-scrim`). AFTER, the same five plus 768 and 1280: scrollWidth = clientWidth at all seven (1280:
    880/880, the column), `maxScrollLeft` 0, scene box 0 … viewport (1280: 200 … 1080, exactly the 880 column), plate and pill 12px
    from the edge, zero offenders. Screenshots before/after at 375 and after at 320: the painting is the screen's width, the plate
    and pill are back at their 12px, names, ranks, flags and both buttons whole at 320.
    **THE FIX** – one declaration: `margin: 0 calc(-1 * var(--app-pad-x))` – the cancellation written as the relationship it always
    was (Home's `.diary-hero` and NextTournamentPanel's hero already spell it so), so the next change to the gutter cannot leave it
    behind again. ⚠ NO `overflow-x: clip` ADDED to the fitted body: with the offender gone it would only mask the next drift – if a
    belt is wanted it is one line on `.tf-fit :deep(.tf-body)`. Zero strings touched.
    **TEST** – `tests/component/round46-prematch-bleed.test.ts`, 5 tests. Arm 1, mounted at 375 / 320 / 768 / 1280: the card's margin is
    `calc(-1 * 16px)` on both sides, the token read off `:root`. Arm 2: `.tf-body` pads its sides by the same token. ⚠ **Arm 2 reads the
    sheet on purpose** – happy-dom computes `.tf-body`'s padding as 24px (the physical shorthand) and ignores the logical
    `padding-inline` override Chromium applies, so a computed "margin + padding closes to 0" arm came out RED on the fixed card
    (−16 + 24) and would have been GREEN on the broken one (−24 + 24): the first draft asserted the bug and refused the fix.
    **Mutation, each alone:** margin back to `-24px` -> arm 1 red ×4 (`expected '-24px' to be 'calc(-1 * 16px)'`), arm 2 green;
    `.tf-body`'s gutter in `src/style.css` back to a literal 24px -> arm 2 red (`expected false to be true`), arm 1 green; both files
    restored byte-identical (`cmp`), `style.css` has no diff against HEAD.
    **GREEN** (verdicts read from files with exit sentinels): the 21 component files that mount or pin `TournamentFlow` / `MatchScene`
    (262 tests); the 68 unit files that reference them or sweep `src/components` (1828 tests); `vue-tsc -b --force` exit 0. The probe
    was a throwaway Playwright spec on its own port and build dir, deleted; no process left.

- [x] **11. «И кстати, она объявит о свадьбе заранее (увидел, объявила, можно там тоже писать сколько
  они вместе, кстати, как вариант)? Или это от отношений и темперамента зависит? И поставим ли мы
  свадьбу в календарь? Картинка есть. Я дождался свадьбы, но самого экрана этого события не было!
  Подозреваю, что с похоронами то же самое и, возможно, с беременностью и родами тоже. Можно делать
  оверлей на весь экран, например.»** – split:
  - **11a** – does the advance wedding announcement depend on relationship/temperament, or always?
    Class: **answer** (read the code, tell him the actual law).
    - **B1 · 11a ANSWER** (read from `src/engine/world/lifeBeat/wedding.ts`): the announcement is
      **unconditional once the roll fires – it depends on neither the quality of the relationship nor on
      temperament.** The gate is `weddingEligible` (wedding.ts:36-44): age ≥ 23 (`ECONOMY.wedding.ageGate`),
      a standing love episode, ≥ 52 weeks together (`minEpisodeWeeks`), no earlier `'engaged'` beat. The roll is
      ONE flat uniform per eligible week against `ECONOMY.wedding.perWeek` = 0.6 % (wedding.ts:56), and the
      header says so plainly: «NO TEMPERAMENT TERM, AND THAT IS THE DRAFTED SHAPE RATHER THAN AN OVERSIGHT»
      (wedding.ts:50). The announcement IS the blocking `'engaged'` card, raised in the week the roll fires
      (wedding.ts:68, the one raise site). The day itself lands `weeksAfterEngagement` = 8 weeks later on **any**
      answer – opposing does not stop it (wedding.ts:99, 108). What the relationship DOES change is only the
      card's WORDING (her own voice by temperament, or the dry card when the bond is low: `ENGAGED_HER_LINE` /
      `ENGAGED_DRY`), never whether it happens. The one way it fails to land: the episode ENDS inside the 8 weeks
      (wedding.ts:110) – and the calendar mark and the screen both follow that.
  - **11b** – put the wedding into the CALENDAR (the art exists). Class: **build** unless the answer
    to 11a changes the shape – the calendar entry follows the announcement.
    - **B1 · 11b SHIPPED.** A band «Her wedding» (bride painting, week label, dates) on `CalendarScreen`, from the
      week she is announced until the day lands. Feed: `upcomingWeddingWeek(world)` (wedding.ts – `landWedding`'s
      own predicate read forward) → `snapshot.weddingWeek` → `weddingMarkFor` (`composables/weekDays.ts`) → band.
      Parity with the day itself is a test: it drives the real `landWedding` week by week and demands the same
      week. Tests: `tests/life-moment-engine.test.ts` (11b block), `tests/component/calendar-wedding-mark.test.ts`.
      DRAFT: R46-S5.
  - **11c** – ⚠ THE DEFECT: he waited for the wedding and **no event screen appeared** despite the
    art existing. Audit ALL big life events – wedding, funerals, pregnancy, birth – which have art
    and which have a presentation moment; wire the missing ones as a full-screen overlay (his
    suggestion). Class: **build** (the round's biggest item).
    - **B1 · 11c AUDIT** (each row read in code, not assumed):

      | moment | what resolves it today | presentation before this round |
      |---|---|---|
      | wedding ANNOUNCEMENT | blocking `'engaged'` beat | `LifeBeatDialog` card, words only (no painting) |
      | wedding DAY | `landWedding` | feed line + album milestone ONLY – **no screen (the defect)** |
      | funeral | blocking `'bereavement'` beat (only on careers with the weight mode on, `weightEnabled`, bereavement.ts) | `LifeBeatDialog` card WITH the funeral painting (`BEAT_FACE`) – it has its moment; he has likely never met one |
      | pregnancy NEWS | blocking `'expecting'` beat | `LifeBeatDialog` card, words only (the pregnancy art rides the portrait via `pregnancyFace`, not the card) |
      | birth DAY | `landBirth` | feed line + album milestone ONLY – **no screen (same defect)** |

    - **B1 · 11c SHIPPED – the wedding DAY and the birth DAY, one mechanism.** `lifeMomentOf(world)` (new,
      `engine/world/lifeMoment.ts`) derives the moment from the milestone ledger: the week a wedding/birth landed IS
      the current week – so no new state and no schema move. Payload `snapshot.lifeMoment` = {kind, week, face, line,
      confirm}; the LINE is the feed's own kept row (no new sentence), the painting is the album's table
      (`MEMORY_EMOTION`: bride / birth). `LifeMomentOverlay.vue`: the shared dialog-card, one Continue control,
      Escape dismisses, owns no sentence; gated behind every blocking question (`lifeMomentMayShow` – deliberately NOT
      in `blockingOverlay`'s list, the engine waits on nothing) and shown once per week (in-memory dismissal – a
      reload inside the same week shows it once more). Tests: `tests/component/life-moment-overlay.test.ts` (renders
      for a resolved wedding and not otherwise · Continue dismisses · the gate · the control inside 375x667 and
      320x568, with DOM arms that go red on a too-tall mutation AND a source mutation that drops the shared card),
      `tests/life-moment-engine.test.ts`. DRAFT: R46-S3, R46-S4.
      **LEFT (art call, not a moment):** the `'expecting'` announcement card has no painting – one row in
      `LifeBeatDialog`'s `BEAT_FACE` plus widening `MemoryFace` to the pregnancy faces would add it.
    - **OWNER RULED (05.10)**: «картинка для родов есть и для беременности две разных, проверь и
      добавляй» – the full set found and named: `adult-bride.webp` (named *bride*, which is why the
      first grep missed it), `adult-birth.webp`, `adult-pregnant-early.webp` /
      `adult-pregnant-last.webp`, `adult-funeral.webp` (wired v87, weight mode only). B1 shipped
      bride + birth; **B1b** wires the `'expecting'` card's early face and verifies the portrait
      serves `pregnant-last` late in term (else adds the late moment).
    - **B1b · SHIPPED (the agent built it, the architect finished it).** The `'expecting'` card wears
      `adult-pregnant-early` through `BEAT_FACE` + the stage-free `pregnantUrl` road – B1b correctly
      REFUSED the brief's «widen MemoryFace» (the pregnancy pair is no band face; a `FACE_BANDS` row
      would have broken the 11.09 lateCareer ruling) and typed the row as a local union instead. Its
      census test pins ALL 13 beat kinds (exactly two draw a painting: funeral, expecting) and the
      painting's band-independence at ages 12/19/25/33. The agent then hung waiting on its own test
      run and died unreported; the architect verified the diff by hand: the run was HONESTLY RED –
      the painting pushed the expecting card's unaided content to 681.2px against the v85 T10 phone
      floor of 635 (the TourBriefingDialog class). Fix: the expecting card wears the art as a 2:1
      band (`life-beat-art-compact`), the funeral keeps its v87 3:2 byte-untouched; file green 65/65
      (`B1B_TEST2_EXIT=0` from the log). **`pregnant-last` verdict**: served by the engine –
      `pregnancyFaceAt` (shared/avatarEmotion.ts:871) returns it for the final `PREGNANT_LAST_WEEKS`
      before the due week on the portrait, `pregnant-early` from the announcement; nothing more to
      add. No strings changed.
  - **11d** – the announcement can also carry «сколько они вместе» (how long together) – shares the
    duration primitive with #9. Class: **build**, DRAFT strings.
    - **B1 · 11d SHIPPED.** Primitive `relationshipDurationWeeks(world, episode?)` in `engine/world/loveEpisodes.ts`:
      the start is `episode.sinceWeek`, ALREADY in state – **no schema move**; null with no partner; a past
      attachment stops counting at `endedWeek`. **#9's personal page (B4) reads this same function.** Threaded into
      the `'engaged'` card: its `said` gets ONE appended sentence (`They have been together for 1 year and 6
      months.` – `engagedWithTogether` / `togetherSpan` in weddingCopy.ts); the pool lines are byte-untouched.
      DRAFT: R46-S1, R46-S2. Tests: `tests/life-moment-engine.test.ts` (11d block).

- [x] **12. «Надо проверить наш вординг на предмет дублей: "The one she married has something to say
  about this season / The one she married stayed back after the plates were cleared." The one she
  married повторяется дважды, давай может всё-таки напишем он, супруг, или вроде того. Мы за здоровые
  отношения.»** – the spouse feed card repeats «The one she married» in header AND first line.
  De-duplicate: pronoun / «her husband» forms. ⚠ Check first whether the phrase is deliberately
  gender-neutral (can she marry a woman?) – the replacement must survive the actual spouse model.
  New wording = DRAFT rows, his blessing. Class: **build**.
  - **B3 · 12 DONE – the heading no longer opens «The one she married»; the pool is untouched.** The dialog's
    heading and every pool line opened with the same four words, so the card said them twice in two lines.
    **Gender verdict:** the spouse model holds NO gender – `LoveEpisode.partnerName` is a first name drawn from
    `PARTNER_NAME_POOL` (28 fictional MALE names) and the copy law is «no gender anywhere in the pool» until he
    rules – so the form that survives any partner is his own «супруг»: **WIRED (R46-S7)** `Her spouse has something
    to say about this season` (one constant, `SPOUSE_VIEW_HEADING`). Alternates, not wired: S8 `Her husband has …`,
    S9 `He has …` (both gendered). **Left alone, listed so he can ask:** the Home card `The one she married wants a
    word.`, the four pool lines and two diary notes (`weekNotes.ts`) still carry the phrase – none is a repeat on
    one screen and the ask named the heading. Test: `tests/wave7-spouse-view.test.ts` §G – the heading and every
    pool line open on different three words, on the constants and on the card the engine assembles; heading
    reverted → 3 RED. The one literal pin that moved with the string is §C's heading assertion. DRAFT: R46-S7,
    R46-S8, R46-S9.

- [x] **13. «Is there another year in this? - картинка съехала и голову обрезает»** – the
  season-decision screen's picture crops the head – same class as round 45 #7 (crop anchored too
  low). Find the screen, anchor the crop, pin it. Class: **build**.
  - **B6 · 13 SHIPPED – the head was cut by the ANCHOR and by the BAND, and an anchor alone could not fix both.**
    **The defect, measured:** `RetirementDialog.vue` steered a fixed 140px band with `facePoint` – the face CENTRE at the same relative
    height in the box as in the painting. On a band that short that is wrong: at the card's widest (372px of picture) the 31+ portrait lost
    about 32px off the top of the head and the 25–30 one about 10px (the face table's own head box, `CROPS`). The round-45 idiom alone
    (`object-position: 50% 10%`) would have traded the cut for a cut CHIN on the 25–30 painting – the head (up to 36% of the painting) is
    almost as tall as the 140px band (38% of a 372px picture).
    **The fix:** the band declares a RATIO (inline `aspect-ratio: 2 / 1`, one constant `ART_BAND_RATIO`) instead of 140px, and the anchor is
    solved for the head at that ratio – `bandFacePoint(stem, ratio)` in `art/faceRects.ts`, `Y = (faceY − ratio/2) / (1 − ratio)` clamped
    to [0, 1] – so the whole head sits inside the window at EVERY width, and a face that is high in its painting (the 31+ one) pins to the
    top (the round-45 anchor, derived per painting). ⚠ THE ONE VISIBLE SIDE EFFECT: the picture is 2:1, so about +14px tall on a 375px phone (a
    ~308px picture, measured in the browser) and +46px on the desktop card (372px).
    **Evidence:** `tests/component/round46-b6-ending-and-retirement.test.ts` – mounted at ages 30 and 41, the inline ratio and position keep
    the head box inside the window at 240 / 303 / 372 / 420px; a control proves the OLD anchor cut it (>8px and >25px at 372px); and
    `bandFacePoint` is swept over every painting in `CROPS`. **Mutated:** `bandFacePoint` returning the old anchor → 2 red; `ART_BAND_RATIO`
    0.5 → 0.3 → 2 red; each restored byte-identical.

- [ ] **14. «Индексный фонд не пересчитывается после изъятия почти всех денег и захода снова:
  "8131.90 units – bought at $9,969 each, $10,212 now / +$49,610,632 since you bought it (33%)" - я
  только пару недель назад зашёл на 80млн, они ещё не могли дать такой прирост»** – the index-fund
  cost basis survives a near-total withdrawal: after re-entering with 80M, «since you bought it»
  still claims +49.6M (33%). The basis must recompute on the re-entry (or the sell must realise the
  gain). Engine economy defect + tests over his exact scenario. Class: **build**.
  - **B9 · 14 MECHANISM SHIPPED, CHECKBOX LEFT OPEN – the basis was never the defect: the card's gain carried round 34 #15's
    realised memory across a near-total withdrawal, and a re-entry that outweighs what is held now retires it. His LIVE row is
    not repaired (last paragraphs). NO SCHEMA, NO WORDING, ZERO DRAWS.**
    **The broken line:** `shopView` in `src/engine/world/shop.ts` – `changeCents = mine.valueCents - mine.paidCents +
    realisedGainCents` (and the `lifetimeCostCents` denominator under it; both were at :1015/:1020 before this commit) – round 34
    #15's lifetime fold. NOT the basis: `sellAsset` releases `paidCents` and `units` by ONE fraction and `avgUnitPriceCents` is
    `paidCents / units`, so «bought at» is honest across any withdrawal – his own line proves it (8131.90 × $9,969 = $81.07M, the
    $80M plus a small residue; $10,212 against it is +2.4%). Only a WHOLE sale deletes the row, so «almost everything» left it
    alive with its realised history, and the $80M arrived beside +$47.6M of the earlier stint.
    **The fix:** `buyAsset`'s top-up branch – new money `>=` what is held (`paidCents >= round(held.units × price)`, i.e. more
    than half of the new holding has earned nothing yet) deletes `realisedGainCents` and `realisedCostCents` from the row. A
    SMALLER top-up keeps them and a part sale still carries them, so round 34 #15's ruling (his 02.09: the sum must not fall when
    money is taken out; `round34-savings-income.test.ts`) is untouched. ⚠ **NOT WHAT THE BRIEF SPELT** («the realised gain LEAVES
    the card» on every sale): that is the second alternative in this item's own text, and it would put round 34's defect back –
    the dollar sum would halve on every withdrawal, and round 34's own header records four figure arms plus the mounted arm in
    `round34-money-shelf.test.ts` going RED when `changeCents` is put back to `valueCents - paidCents`. The first alternative
    («recompute on the re-entry») is what shipped; the other is one line in `shopView` and the owner's call.
    **No schema:** the two fields are the optional ones `shopView` already reads as «none recorded» when absent. **No wording:** no
    `.vue` touched, and the 17 mounted files that print the card (152 tests) are green. **RNG:** zero draws, the frozen capture
    untouched.
    **His card, from the walked scenario** ($70M in at year 3, ten years held, 98.5% out, six weeks, $80M in, two weeks on):
    `9352.89 units – bought at $8,666 each, $8,843 now / +$59,858,752 since you bought it (40%)` → `+$1,659,352 since you bought it
    (2%)`. The seed's own walk, so the digits are not his; the class is (his +$49.6M / 33% → the +$1.9M / 2% class).
    **Evidence:** `tests/round46-fund-reentry.test.ts`, 7 arms – his scenario; round 34 kept (a smaller top-up and a part sale
    keep the memory); the boundary at half; a walked conservation sequence (the basis is only ever moved, and the memory a
    re-entry retires re-adds with what is left to the realised total); proportional release (half out = half the cost, the same
    average); a live-shape save through `migrateSave` (loads unchanged, heals on its re-entry); a pre-round-34 shape.
    **Mutated:** the comparison made `false` (= the unfixed tree) → 4 RED; the basis release in `sellAsset` deleted → 9 RED (4
    here, 5 in round 34 / part-sale); reset on EVERY top-up → 1 RED (round 34's arm, alone); each restored byte-identical (cmp).
    `round34-savings-income`, `round29p2-part-sale`, `secondary-market-s4`, B5's `round46-season-money` and `round46-career-money`
    green; `vue-tsc -b --force` exit 0 (read from the log's sentinel, not the wrapper).
    ⚠ **NOT REPAIRED, AND SAID:** a LIVE save whose row already carries the memory (his own career, re-entered before this change)
    keeps it until its next dominating top-up. The row alone cannot say whether its last sale came before or after its last
    entry, so a retroactive repair is a HEURISTIC migration – a schema move (v92, golden fixture, `e2e:fixtures`): retire the
    memory when the last `entries` mark is >= 90% of `paidCents` and `paidCents` >= that mark (his row: $80M of $81.07M). Its only
    error is a small sale AFTER such an entry, which loses that sale's own gain from the card. Not built – the architect's call
    (about ten moves); no DRAFT strings row, since no wording moved.
    ⚠ **TWO RED UNIT FILES ON `round/46` THAT ARE NOT THIS ITEM'S** (control: `shop.ts` at HEAD fails them identically, 7 arms):
    `tests/coach-travel-edge-prior-schemas.test.ts` (the v71-v76 rollback hashes) and
    `tests/principles-d08-store-payload-clone.test.ts` (the store's sender set no longer matches the one the file drives).

- [x] **15. «Эта фраза вылезла 2 раза с разницей в месяц или два (и вообще он очень разговорчивый и
  часто повторяется): "…The next tournament is half a world away. I knew the life I married into.
  Some weeks I would just like it nearer."»** – the same spouse line verbatim twice within a month or
  two, and the spouse talks too often overall. Add a no-repeat memory (and look at the overall
  chattiness rate). ⚠ Likely touches the save schema if lines-said must persist. Class: **build**.
  - **B3 · 15 DONE – a no-repeat memory, DERIVED (no schema), and the chattiness measured: 5.18 → 2.92 per latched
    season.** **The road: derivation.** The save already keeps what is needed – every `'spouse-view'` row in the
    append-only, never-pruned `lifeLog` carries its week and its occasion (`detail`) – so `rollSpouseView` drops the
    occasions raised inside the last `ECONOMY.wedding.spouseViewNoRepeatWeeks` (52, a season) weeks and picks among
    the rest; none left = a silent week. **No schema bump, no migration, no golden fixture, no `e2e:fixtures`
    regeneration – and nothing new is saved** (H5 round-trips a world through JSON half way and the continuation is
    identical). **RNG:** the pick was already a purpose-scoped sub-stream (`<seed>:life:spouse-view:<week>`, never
    MAIN); it is still ONE draw on that key over fewer candidates, and a stale-only week derives no key. The frozen
    MAIN capture (`tests/condition.test.ts`) is green and the bench's input-independence arm (g) holds. **What he
    saw:** the pool is ONE line per occasion and the pick is uniform over the occasions true this week; three are
    true on most weeks, the 10-week cooldown was the only brake and the surface sat on it (spec §4: 5.13 of 5.2), so
    the line he had just heard came back with probability 1/2 to 1/3. **Chattiness, measured** (`bench:wedding
    --seeds 20`, 60 careers, one walk, 117.2 latched seasons in both arms): **5.18 → 2.92 beats per latched season**
    (predicted 2.5–3.0), mix within 2 points, every other bench line byte-identical. His cooldown of 10 is untouched;
    the one further knob is the window (78 → about 2.0, 104 → about 1.5, predicted) – his call. Tests:
    `tests/wave7-spouse-view.test.ts` §H (H1–H5 plus the old-roll control) – mutations: filter removed → 3 RED, window
    off by one → 2 RED, stream hoisted above the empty check → 2 RED. Spec: `the-wedding-2026-09.md` §6.

- [x] **16. «W11 2049 в календаре показали injured, на home injured walkover, но при этом пустили
  играть на w500 и далее выиграли 2 мачта, что-то странное было. Сейв во вложении»** – calendar said
  injured, home said injured walkover, yet she PLAYED the W500 and won 2 matches. ⚠ **The save did
  not reach this session** (and #20 says he currently cannot export saves at all). Hunt the
  injured-entry/walkover law in code + sim reproduction; ask him to re-send the save once #20 ships.
  Class: **measure/hunt**, honest status if not reproducible blind.
  - **B2 · 16 DIAGNOSED, REPRODUCED, FIXED** (the save never arrived – found in code, then reproduced on the
    unmodified build). **The engine is right and two screens lied.** The law: the surfaces he names – home's
    `snap.arrival` (`arrivalPreview`, snapshot.ts) and the Calendar grid (`calendarWeekFor` → `injuredNow`,
    weekDays.ts) – ask the CLINIC's `weeksRemaining` whether the layoff covers next week (`arrivalStatus` →
    `layoffCovering`); the tick asks what is left after `rollInjury` has ALSO paid the masseur's rehab week
    (injury.ts:395 and :419, `tickWeek` increments the week first, tick.ts:206). Clinic = 2 weeks left and his
    cadence landing on the next tick ⇒ screens «injured / walkover», tick 2 − 1 − 1 = 0 ⇒ cleared, the entered
    W500 is PLAYED (the walkover arm, phaseHerWeek.ts ~944-956, only fires on a still-injured arrival). One week
    wide per layoff and only on the cadence's parity – hence «что-то странное». Round 34 #21 closed this gap for
    the onset sweep and round 41 #19 for the dialog; the preview never got it and its own doc claimed «the layoff
    cannot move».
    **Killed:** walkover-then-play in one week (one if/else-if chain on one `enteredThisWeek`; the walkover arm
    stashes nothing); a play-time hole in the entry law (the verdict is re-read on the play week; the test asserts
    «plays ⇔ layoff over» in every sweep cell; the dev ▶▶ and `advanceWeeks` both run `tickWeek`); a pre-injury
    entry never re-validated (it is, on arrival).
    **Reproduced** (`tests/round46-arrival-masseur-parity.test.ts`, red before the fix): his state gave home
    `injured`, grid `injured`, tick `play`; the 54-cell sweep (3 rungs × layoff 1–6 × 3 cadence phases) disagreed
    in exactly 10 cells, every one «clinic has 2, cadence lands on the next tick». **Fix – a parity read, no
    wording, no RNG, no schema:** `arrivalPreview` asks `layoffCoversWeek(week, weeksRemaining −
    masseurRehabWeeksAhead, eventWeek)`; the Calendar grid and the Season chips go through the new
    `layoffHoldsWeek` (weekDays.ts), which reads the wire's `expectedWeeks` for the PLAYED week only. Byte-identical
    for every career without a masseur. One source pin re-aimed (`round12-view.test.ts:203`).
    **NOT touched – the architect's / owner's calls:** (a) the look-ahead rows (they start at week + 2) and the
    Season rows past next week still draw the clinic's window, so a calendar glanced at earlier can still say
    «injury» on a week the masseur then clears – widening it breaks round 34's «the countdown is not rewritten»;
    (b) the ENTRY GATE and the planner (`layoffCovering`, the clinic's window) still refuse a NEW entry or booking
    in a week the replay says she is back – the same class one gate over, and making `layoffCovering` masseur-aware
    is the entry law itself. **Still wanted:** his save once #20 ships, to confirm it was the masseur case
    (a masseur hired and two weeks left on the clinic's clock at W10).

- [~] **17. «А может быть нам какую-то микро языковую модель подключить для этих всех смолл токов
  можно (я знаю такие есть крохотные) и запускать прямо в браузере внутри приложения для генерации
  фраз и ответов? Это вообще возможно? Мне кажется это дало бы нам очень мощный буст вариативности на
  основе всех наших существующих фраз и всей истории уже сказанного ранее.»** – an in-browser micro
  LLM for smalltalk variability. Class: **answer** (the architect's feasibility analysis: size,
  offline-first, determinism law, voice control – with a recommendation and alternatives).
  - **ANSWERED IN CHAT, OWNER CLOSED IT: «уговорил.»** (05.10). The case: +100–350 MB before the
    prologue against the offline-first funnel; cross-device float nondeterminism against his own
    reproducible-variability law; a 135M–500M model against the wording law (unblessed strings,
    off his voice, hallucinating against the career). The path taken instead: build-time LLM
    generation he blesses in DRAFT batches + combinatorial slots + the #15 no-repeat memory +
    diary callbacks. **Smalltalk-corpus expansion goes to the NEXT round's list.** Full entry:
    decisions.md 05.10.

- [x] **18. «Я нажал that's enough и снова увидел не наш красивый альбом, а набор детских фото и в
  конце 1 взрослую. Надо исправить, давать возможность посмотреть весь альбом и подумать какой вообще
  там флоу.»** – pressing «that's enough» (retirement) shows a legacy reel of childhood photos + one
  adult shot instead of the real album book. Route the epilogue to the full album and propose the
  flow. Class: **build** (+ the flow proposal in the report).
  - **B6 · 18 SHIPPED – the real album is one tap from the last page, and the seven-polaroid reel left the screen. FLOW PROPOSAL BELOW.**
    **Diagnosis:** `EndingScreen.vue` is the epilogue of career-contract-v1 §9 – seven polaroids, each the portrait of the life STAGE the
    engine picked a moment from (`EndingView.album`, `AlbumPage`), so a career that lived mostly in its early years drew mostly children
    and one adult. It predates the album book (rounds 44–45: `AlbumScreen` + `assembleAlbum` over the milestone ledger), and its own eyebrow
    said «The album» – two things called THE ALBUM on one career was the defect; the reel's selection was only its visible half.
    **Shipped:** the reel's first six pages, its pager (Back / Next), its dots and «n / 7» are gone. What stayed is the reel's LAST page exactly
    as it was – the photograph, the ending's own title (`caption`) and lines, then the figures – because it carries HOW the career ended
    (the nine titles); its eyebrow («The last page») is unchanged. A new lead control on it, `View the album` (DRAFT R46-S17), lays the REAL book
    over the takeover: the same `AlbumScreen`, the same worker query (`game.loadAlbum`) the Home door uses, every sheet, the chapter rail and the
    pager. Its Back arrow returns to the card where it was left (the book opens at its own top; the card's scroll is restored); a refused fetch
    cannot trap the player (empty chrome, Back still works); a late answer from a closed layer is dropped (the ticket, App.vue's own rule).
    **⚠ Strings that LEFT the screen (invariant 4 – listed so he can veto):** the eyebrow «The album», the reel's «Back» / «Next», «n / 7», and
    the engine-authored lines of pages 1–6 (`EndingView.album` is still on the wire; only its last page is read). **Unchanged:** everything else –
    including «Back to the album» on the record page, which now returns to the last page (ALTERNATE R46-S20 is his call).
    **FLOW – shipped:** «That is enough» → the last page (the photograph and how it ended) → `View the album` (every sheet) → Back → the figures,
    `The whole record`, the two doors, the service export. **PROPOSED, NOT SHIPPED – his taste calls:** (1) open the book AUTOMATICALLY the first
    time the ending is shown, so «that's enough» lands on the album itself and the card is its Back destination – a per-career «seen» flag if it must
    not reopen on every reload (a schema move), a transient one if it may; (2) retire `EndingView.album` pages 1–6 from the wire once he has confirmed
    the reel stays gone (engine + wire change, so not done here); (3) an ending-aware label on the album's Back arrow (R46-S19 – it is announced
    «Back to Home» inside the ending; it is an icon button, so the words are the screen-reader's).
    **Evidence (mounted):** the door is first in the footer and the pager is gone; pressing it renders `AlbumScreen` over a REAL book (the engine's own
    `assembleAlbum` over a posed `createWorld` world – the dense-period recipe `albumBook.test.ts` pins at three sheets – a dot per sheet, «Sheet 1 of
    N», the first sheet's own chapter title); Back returns; the book opens at its top and the card's scroll is restored; a null book cannot trap; a stale
    answer cannot paint the next layer; phone fit at 375×667 and 320×568, `setViewport` BEFORE the mount (the takeover scrolls, the Back arrow is the first
    control, the door is on the first screen, the export control is reachable and every control fits the width).
    **Mutated:** the door's click dead → 6 red; `@back` dead → 4 red; `.ending` `overflow-y: auto` → `visible` → 5 red (this file's phone cases and
    wave10's fit case); each restored byte-identical. **Pins repointed, never weakened (7 existing files):** `endings-ui`, `wave8-family-ending`,
    `wave10-dynasty-door`, `wave12-parting-album`, `r39-lifetime-letter`, `round46-the-reckoning`, `round24-college-shell` – the reel's own claims
    (page turning, dots, «n / 7», an empty page 3) became the last page's, and the «Next ×6» walks to the last page are gone. One e2e spec walked the reel as well – `e2e/dynasty.spec.ts` clicked Next ×6 before the door – and the walk is removed there; ⚠ e2e was NOT run (outside this brief's gates), so that spec is one of the things the pre-push gate has to confirm.
  - **B6 · 13 + 18 SEEN IN A REAL BROWSER** (the Vite dev server and a throwaway page mounting the real `RetirementDialog` and `EndingScreen`, since deleted – the B5 precedent), at 375×667 and 1280×800.
    **13:** the 31+ and the 25–30 portraits show the whole head with room above it, on the 2:1 band – no cut hair, no cut chin. **18:** at 375×667 the last
    page shows the photograph, the ending's title and lines, and `View the album` on the first screen, above the figures; pressing it lays the real book over
    the takeover (chapter header, the sheet, the film with its «Left half» marker, the pager dots and arrows) with the Back arrow top-left. At 1280×800 the
    book sits in the 480px column and the sheet bleeds past it by the app gutter – `AlbumScreen`'s own side-gutter cancel, as it documents.
    ⚠ NOT LOOKED AT: the real `App.vue` shell around the two screens (the harness mounts the components, not the app), the browser console, and the e2e route
    (`e2e/dynasty.spec.ts` was repointed, not run).

- [x] **19. «Потраченные суммы на итогах снова не соответствуют действительности. А ещё там верстка
  пляшет. Можно миллионы сокращать до М, например и красиво все выстроить.»** – the summary's SPENT
  amounts are wrong **again** («снова» – check earlier rounds' ledgers; if a prior round reported
  this fixed, mark `[!]` REOPENED with what the first fix aimed at). Plus the layout dances; his
  formatting ruling: abbreviate millions to «M» and align. Same surface as #8 – one bundle. Class:
  **build**.
  - **B5 · 19 REOPENED → SHIPPED – the spent total of THIS surface had been «fixed» twice, each time on a different axis; this one fixes the
    DEFINITION (the fix is #8's).** ⚠ **THE REOPEN STORY** – the sentence that stops a third miss:
    **(1) R11-12a (round 11)** – he compared the popup's spend with the wallet's «This season» (his $59,740 against $95,507). That fix
    reconciled the WINDOW (it now ends on the wrap week, like the wallet's) and the CATEGORY COVERAGE (the 400-row event feed → the pruning-proof
    `financeWeeks` ledger), and banked spend and income apart. It aimed at «the popup agrees with the wallet» and got there by making the popup
    the wallet's GROSS fold – which is exactly why it could not see that a deposit is not «spent». **(2) the 18.09 reckoning**
    (`docs/specs/the-reckoning-2026-09.md`, headed «round 46 items 9 and 10» there and in the code comments – an EARLIER numbering than this
    round's #9/#10) asked precisely that question of the CAREER totals (album, epilogue, break-even: `careerMoney`, `isHoldingCategory`) and
    left the season accumulators alone, so the career page and the year card told two stories about one family. **Not this surface:** round 31
    #2 (the audit this ledger named) was the WEEK-ENTRY card (Income / Other income / Spent / Balance), and round 34's «earned / spent (family
    side)» line is a measurement table, not a fix. **WHY «СНОВА»:** every prior fix reconciled the card to a FIGURE; none reconciled it to a
    DEFINITION. It re-opens whenever a family buys an asset – his own finished career (house, fund, academy, boats).
    **THE «М»:** `formatCentsCompact` / `formatCentsSignedCompact` (`shared/money.ts`, the one money module): from $1M up a figure is «$12.4M» /
    «+$2.1M»; below that it is EXACTLY what the full forms print (pinned across a spread); the boundary is read off the ROUNDED dollars, so
    `$999,999.60` is «$1.0M» and no «$1,000,000» ever stands in an M column. It is the one place a decimal point appears on money, and the
    abbreviation is his ruling. **THE LAYOUT:** the Money tile is one two-column grid (`.season-money`) – labels in the left track, every figure
    in the right, rows `display: contents`, hairlines spanning both, figures `nowrap` in tabular numerals – instead of wrapping flex rows with the
    bottom line set a point larger. **PHONE:** the card with the shelf and both wealth rows is mounted at 375×667 with the global sheet
    loaded and `setViewport` BEFORE the mount, the dismiss control is reachable, and uncapping the card turns the arm red.
    **SEEN IN A REAL BROWSER** (the Vite dev server and a throwaway page mounting the real component over the real wrap-up of the scenario,
    since deleted): 375×812, 375×667 and 320×568 – the Money tile is one right-aligned column that does not wrap, the figures read «-$1.0M» /
    «+$3.9M» / «$10.4M» beside «+$42,000», the card scrolls inside its height cap on the phones, no console errors; a modest family's card is the
    card it always was (full dollars, no shelf, no wealth rows).
    ⚠ **WHAT THE EYE ALSO SHOWED, AND I DID NOT TOUCH:** the half-width Ranking / Matches tiles keep their wrapping flex rows by design (the
    capture-pass rule: a value drops under its label rather than the card scrolling sideways), and in the browser they visibly ALTERNATE – some
    values sit beside their label (Record, Lost to injury), others drop under it (Best result, Tournaments entered), and WHICH rows do changes with
    the width (320 against 375). If THAT is also his «пляшет», it is one rule (`.season-row` stacked in the half tiles, or a two-column grid with
    the figures right-aligned) and his call – a card he has seen for many rounds is not redesigned on a guess.

- [x] **20. «Не могу сейв выгрузить кажется теперь никак из-за последнего экрана, у меня там много
  вопросов было на проверить. Может для служебных целей сделать там отдельную кнопку для сейва? Тогда
  я его смогу выгрузить на анализ»** – the final screen blocks reaching the save export; add a
  service export-save control reachable there (the ▶▶ 52 precedent: dev controls ship in every build
  by his ruling). Unblocks #16's save. Class: **build**.
  - **B6 · 20 SHIPPED – `Export save (dev)` on the last page, the SAME call as More's «Export to file».**
    **Why he could not:** the epilogue is a takeover over the tab shell, so More's Saves strip was unreachable from the one screen where a finished
    career's questions live, and «Raise another» drops the career. **What:** a small link at the foot of the last page, after the two doors, running
    `game.exportSave()` – the very store action More's button runs (worker `exportSave` query → `encodeExportFile` → the same blob/anchor download).
    Zero new serialisation, and an export is a read, so the career is untouched. It follows the `▶▶ 52 (dev)` precedent (ships in every build, tagged
    `(dev)`); the label is a DRAFT (R46-S18).
    **Evidence (mounted):** the control exists and runs the store's export path once; and the SAME bytes – with the worker stubbed, `game.exportSave()`
    (More's path) and the control produce the identical request (`{ type: 'exportSave' }`), file name and Blob (size and type), asserted equal.
    Phone fit at 375×667 and 320×568 (`assertDismissReachable` + width). **Mutated:** the click dead → 2 red; the handler calling another store
    action → 2 red; restored byte-identical.

- [x] **21. «Если выбираем A daughter came later то имя точно не как у мамы должно быть мне
  кажется»** – in the epilogue's «A daughter came later» the daughter's name must never equal her
  mother's (the played kid's) name. Exclude it in the pick + test. Class: **build**.
  - **B6 · 21 SHIPPED – the daughter's card never proposes or rolls her mother's name. STREAM VERDICT: no MAIN and no engine stream – the name is not drawn in the engine at all.**
    **What he met:** the name is not picked in `endings.ts`; it is the identity card of the dynasty childhood (`ChildhoodPrologue`; the wizard on skip).
    That card OPENS on `OPENING_IDENTITY.kidName` = `DEFAULT_PROFILE.kidName` («Alice»), and a mother who never touched her name field IS «Alice» –
    so the daughter was proposed under her mother's own name; the first-name die (`randomName`, 24 names) could also roll it.
    **The fix** (`composables/identityDice.ts`): `sameFirstName` (case, spacing, accents), `namePoolWithout` (the menu LESS her name – FILTERED BEFORE
    the draw: one draw, no re-roll loop), `randomName(exclude)` (still ONE `Math.random`, which that file's header explains is legal pre-world) and
    `dynastyOpeningName(childSeed, motherFirst, standing)` – the default stands unless it is the mother's, and only then is ONE name picked, on the
    purpose-scoped sub-stream keyed `childSeed:daughter-name` (derived at the call site, persists nothing, reproducible; the daughter's world is born
    on that very seed). The wizard's first roll and reroll and the prologue card's die (`line.motherFirst`) pass the mother's name. ⚠ The parent may
    still TYPE any name (his 20.09 ruling stands) – the card only stops proposing the one that cannot be right.
    **Stream verdict, stated:** the die is `Math.random` (unchanged, pre-world, never persisted); the new opening pick is a sub-stream; MAIN is not
    touched anywhere. No engine file was edited, so the frozen MAIN capture was not re-run – nothing here could move it.
    **Evidence:** `tests/dynasty-daughter-name.test.ts` (unit, 9): 200 seeds × the default and all 24 pool names – never the mother's; the default stands
    when it is not hers (control); 200 daughters of one mother cover >15 distinct pool names (control); reproducible; the pick equals the first value of
    that sub-stream over the filtered menu with ZERO `Math.random` calls; case and accent; the die swept over the whole unit interval never lands on her
    name and still reaches the other 23; ONE `Math.random` per roll even on the roll that would have hit her name; and 200 REAL `createWorld` worlds with
    kids named off the pool → `dynastyHandoverOf` → never shared. Mounted (3): the prologue opens on a pool name when the mother kept the default;
    control – another mother leaves the default alone; the die pressed at every index never rolls hers. **Mutated:** the default always standing → 6 red;
    the pool unfiltered → 4 red (+ the mounted die case); restored byte-identical.

- [x] **22. «хотел дождаться, чтобы она родила, но так и не случилось - может быть в целях разработки
  можно в найстройках сделать переключатель, поднимающий шансы наступления этих событий в разы для
  отладки?»** – a dev settings toggle multiplying life-event hazard rates (pregnancy/birth and kin)
  for debugging. ⚠ Design with the RNG law in hand: sub-stream hazards only, MAIN untouched, dev-only
  surface. Class: **build**.
  - **B1 · 22 SHIPPED.** A dev switch `▶ life events ×8 (dev)` in More beside `▶▶ 52 (dev)`. A TRANSIENT worker
    flag (`engine/world/lifeBoost.ts`), set by the new `devLifeBoost` command through the existing RPC (reply = the
    snapshot, whose `devLifeBoost` is the switch's state), on no `WorldState` – so in no save. It multiplies the
    probability at the four compares where a rolled uniform meets a chance (wedding, pregnancy, partner arrival,
    bereavement); `rollEnds` and every gate are untouched, so she still cannot marry before 23. **MEASURED** (30
    seeds, posed worlds, `tests/life-moment-boost.test.ts`): wedding first-fire mean OFF 208.3 weeks → ON 22.5
    weeks (185.7 weeks, 3.6 years, earlier); pregnancy arrives inside her window on 10/30 seeds OFF vs 26/30 ON;
    ON ≤ OFF on EVERY seed for all four hazards (the uniform per week is the same, `u < p` ⇒ `u < 8p`). OFF is
    `p * 1`, bit-identical: the byte-identity case, MAIN untouched, the frozen capture (`tests/condition.test.ts`) and
    the ten wedding/pregnancy/bereavement/birth wave files all green. ⚠ A save made UNDER the boost carries the
    boosted outcomes (an early wedding is a real wedding), never the switch. A dev surface, not a balance change –
    so no spec. DRAFT: R46-S6 (dev label).

---

## The plan – bundles by collision surface, sequential dispatch (token law 29.09)

Orientation facts the bundles are built on: spouse heading = `spouseViewCopy.ts:29` (header and the
`distant-swing` line both open «The one she married»); the bank-account ask is a birthday-gift row in
`birthday.ts:534` with no age gate visible; `lifeBeat/wedding.ts` is 121 lines and no wedding appears
in `LifeBeatDialog.vue`'s painting table (the funeral painting IS wired there, v87); the sell/withdraw
cards live in `ShopPanel.vue` + `MoneyScreen.vue`; the year summary is `SeasonSummaryDialog.vue` and
the spent-totals surface was already worked in round 31 (#19 is a REOPEN candidate – audit first);
«Is there another year in this?» = `RetirementDialog.vue`; «A daughter came later» = `EndingScreen.vue`;
the album ticket = `AlbumTicketPass.vue`; no −15% injury modifier surfaced for ANY asset in the first
grep – B9 confirms what «тоже» refers to before copying it.

| Step | Items | Surface owned (no two bundles share a file) | Model · budget |
| --- | --- | --- | --- |
| A0 (architect) | 7 probe, 3a probe | tools/ probes, read-only | – |
| B1 | 11a 11b 11c 11d 22 | `lifeBeat/wedding*`, `pregnancy.ts`, `LifeBeatDialog.vue`, calendar wiring, worker dev command | sonnet · 70 |
| B2 | 16 | engine entry/injury law, sim repro (read + fix if found) | sonnet · 50 |
| B3 | 12 15 | `spouseViewCopy.ts`, `weekNotes.ts`, no-repeat memory | sonnet · 55 |
| B4 | 9 | personal page (`KidScreen.vue`), consumes B1's duration primitive | sonnet · 40 |
| B5 | 8 19 | `SeasonSummaryDialog.vue` + the engine ledger it reads | sonnet · 55 |
| B6 | 13 18 20 21 | `RetirementDialog.vue`, `EndingScreen.vue` | sonnet · 60 |
| B7 | 1a 1b | `ShopPanel.vue`, `MoneyScreen.vue` asset cards | sonnet · 45 |
| B8 | 5 | `birthday.ts` age gate | sonnet · 30 |
| B9 | 14 | index-fund cost basis (economy module + tests) | sonnet · 45 |
| B10 | 6 | yacht injury modifier + bench/spec note | sonnet · 40 |
| B11 | 10 | between-matches screen overflow (`MatchScene.vue` candidate) | sonnet · 35 |
| B12 | 4 | `AlbumTicketPass.vue` rotation | sonnet · 25 |
| B1b | 11c art follow-up | `LifeBeatDialog.vue` BEAT_FACE + MemoryFace (pregnancy faces) | sonnet · 20 |
| B13 | 7 (ruled 05.10) | run ladders in `engine/economy/condition.ts` + probe + corridor re-pins | sonnet · 55 |
| B14 | 3 (ruled 05.10) | house entry-price indexation (shop quote path) + tests | sonnet · 35 |
| Architect | 3b ✓, 17 ✓, succession spec (ruled: Александра-мать · дом+машина+слайс через мультипликатор финиша · спека сейчас, стройка пост-лонч), gates, report | – | – |

Sequencing notes: B1 first (biggest, and #22's hazard multiplier shares its files); B2 early so a
found defect leaves room for a follow-up fix agent; B4 after B1 (the «how long together» primitive
is built once, in B1). Schema: any bundle that cannot derive its state does the FULL four-part move
(v92+, append-only), and says so in its report – B3's lines-said memory is the likely candidate, the
brief's preference is derivation from the diary.

## Cross-references

- #3a is the round-45 #10 class (the brand grind) on a new asset class.
- #8 + #19 are one surface (the year summary) – one bundle, and #19 may be a REOPEN (audit first).
- #9 + #11d share the «how long together» primitive – build it once.
- #12 + #15 share the spouse voice/corpus surface – one bundle.
- #16 is blocked on a save that #20 unblocks – ship #20, then ask for the save again.
- #17 answers feed #15's design (the no-repeat memory is the non-LLM half of his variability ask).
- #18 + #20 + #21 live on the epilogue surface – one bundle.

## DRAFT strings (R46-S…)

Every PLAYER-FACING string a builder adds this round lands here as a draft for the owner's blessing (invariant 4:
a label, tab, button or sentence on screen changes only when the task asked, and these are the new ones the asks
required). Rows are appended in the order they are written; ids continue where the last builder stopped (B1 holds
S1–S6, B3 holds S7–S9). A row the owner rewords changes ONE constant, named in the second column.

| id | where | the line |
|---|---|---|
| R46-S1 | 11d – the `'engaged'` announcement card, appended after her line (`weddingCopy.ts` `engagedWithTogether`) | `They have been together for {span}.` – e.g. `They have been together for 1 year and 6 months.` |
| R46-S2 | 11d – the span words (`weddingCopy.ts` `togetherSpan`; #9's page may reuse them) | `1 year` · `{N} years` · `1 month` · `{N} months` · `{N} years and {M} months` · `less than a month` |
| R46-S3 | 11c – the one control on the full-screen wedding / birth moment (`lifeMomentCopy.ts` `LIFE_MOMENT_CONFIRM`) | `Continue` |
| R46-S4 | 11c – NOT new: the lines the moment shows are the feed's EXISTING kept lines, unchanged (listed so he knows what the new screen will say) | wedding: `Her wedding day. The family was there, whatever had been said about it.` · birth: `Her daughter was born this week. The family has somebody new in it.` |
| R46-S5 | 11b – the calendar band (`CalendarScreen.vue`), the shared week label and dates beside it | `Her wedding` |
| R46-S6 | 22 – dev-only label in More (not player copy; listed for completeness) | `▶ life events ×8 (dev)` |
| R46-S7 | 12 – the spouse beat's heading, **WIRED** (`spouseViewCopy.ts` `SPOUSE_VIEW_HEADING`; the dialog's frame over the line; was `The one she married has something to say about this season`, which opened with the same four words as the line under it) | `Her spouse has something to say about this season` |
| R46-S8 | 12 – ALTERNATE for S7, NOT wired (the same one constant) | `Her husband has something to say about this season` – gendered: the partner's name pool is 28 male first names, so it never contradicts a name on screen, but the schema holds no gender and the pool's «no gender» law stands until he rules |
| R46-S9 | 12 – ALTERNATE for S7, NOT wired (the same one constant) | `He has something to say about this season` – his own «он» and the shortest; the Home card above it (`The one she married wants a word.`, unchanged) is its only antecedent; also gendered |
| R46-S10 | 9 – the personal page's relationship line, **WIRED** (`kidLife.ts` `togetherNote`, one function; the sentence sits under the tile grid on `KidScreen`, beside the school and college notes; the span words are S2's and are not repeated here) | `Together with {name} for {span}` – e.g. `Together with Anton for 1 year and 6 months` · married: `Married to {name} – together for {span}` · before the engagement has written a name: `Together for {span}` · married with no name (hand-built rows only – the engine names him at the engagement, before any wedding): `Married – together for {span}` |
| R46-S11 | 9 – ALTERNATE for S10, NOT wired (the same one function) | name-first and shorter: `{name} – together for {span}` · `Together for {span}` · `Married to {name} – together for {span}`; the cost is that the unnamed form reads as a fragment with no subject, which is why S10 keeps «with» in the named form |
| R46-S12 | 8 + 19 – the year-end Money tile's shelf row, **WIRED** (`SeasonSummaryDialog.vue`, the `season-key` between «Earned this season» and the hairline; hidden at zero; it carries the whole `'shop'` category's net – purchases, the cars' upkeep and sale proceeds – because the ledger has no category of its own for upkeep) | `Holdings and upkeep` |
| R46-S13 | 8 + 19 – the growth row under «Family's portfolio», **WIRED** (same file; absent when there is no previous wrap-up to subtract from) | `Portfolio growth` |
| R46-S14 | 8 + 19 – NOT new: the wealth row's label is the EPILOGUE'S OWN for the same figure (`EndingScreen.vue`, `careerMoney.portfolioCents`), now also on the year-end card under its own hairline – listed so he knows the card will say it | `Family's portfolio` |
| R46-S15 | 8 + 19 – ALTERNATE for S12, NOT wired (the one `season-key` in the template) | `Put into holdings` when the shelf's net is out, `Taken out of holdings` when it is in – plainer, but two lines, and «upkeep» (a boat's crew) is not «put into» anything |
| R46-S16 | 8 + 19 – ALTERNATE for S13, NOT wired (the one `season-key` in the template) | `Up on last season` / `Down on last season` – the year-on-year reading in his words; the wired label is neutral for either sign |
| R46-S17 | 18 – the lead control on the epilogue's last page, **WIRED** (`EndingScreen.vue`, the first child of `.ending-foot`; lays the real album book over the takeover) | `View the album` |
| R46-S18 | 20 – the service export on the same page, **WIRED** (`EndingScreen.vue`, the last child of `.ending-foot`; the SAME call as More's «Export to file» – a dev control on the `▶▶ 52 (dev)` precedent) | `Export save (dev)` |
| R46-S19 | 18 – ALTERNATE for the album's Back arrow inside the ending, NOT wired (`AlbumScreen.vue` announces `Back to Home` – an `aria-label` on an icon button; there is no Home behind the ending, and a label prop on `AlbumScreen` would be the move) | `Back to the last page` |
| R46-S20 | 18 – ALTERNATE for the record page's existing link, NOT wired (`Back to the album` now returns to the last page, not to a reel) | `Back to the last page` |
| R46-S21 | 18 – ALTERNATE for S17, NOT wired (the one `PrimaryPill` in the footer) | `Open the whole album` |
| R46-S22 | 1b – the listed card's Sell control, **WIRED – his words, wired** (`ShopPanel.vue`, the `row.listing` branch prints `SALE_LABELS.sellNow`; no new constant – the popup's second door already carries it; the yellow fill is `--warning`) | `Sell now` – his «sell now», in the app's sentence case (the unlisted control still reads `Sell` and Withdraw still `Withdraw`, both untouched) |
