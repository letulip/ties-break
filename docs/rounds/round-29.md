---
type: round-ledger
status: current
area: rounds/29
canonical: false
last-reviewed: 2026-08-28
---

# Round 29 – the pro years, 18 items (28.08.2026)

Status: `[x]` shipped on the branch · `[~]` answered, nothing to build · `[>]` in flight, agent named
· `[ ]` open · `[?]` waiting on the owner · `[!]` REOPENED (was reported done, was not).

**His own words, in his own numbering**, off save `alice-cfbv_w780` (⚠ personal, `~/Downloads`,
READ-ONLY – never copied into the repo, never a fixture) and three screenshots: the season feed at
W47–W2 '44/'45, the inbox, and the Tour office letter.

⚠⚠ **CORRECTION – the save IS schemaVersion 65, so he played a build WITH round 28 in it.** My first
note here said the opposite. That matters most for item 10: round 28 #15 widened her cut to sponsor
cheques, and it is live in this save.

⭐ **His instruction on how to run this round**, and it shapes every bundle below: «делай план работ,
выбирай агентов и запускай всю волну поочередно в ночь, работы много, мы не торопимся, одновременно
не надо делать, а пошагово вполне отлично». **One agent at a time.** No parallel fan-out – the
contention artefacts of round 28 cost more reading than the wall-clock they saved.

⭐ And his verdict on where we are: «По победам как-будто по-лучше стало» (item 4) and «Сейчас уже
ощутимо хорошо».

---

- [ ] **1. «На 23 неделе 44 года у меня в ленте был Шлем и не подал заявку, девушка была exhausted,
  я выбрал отпуск, отдохнул, вернулся – а шлема в ленте нет! Текущее место 116 (минус 11) показывает.
  После победы w500 снова появился. Это не очень хороший паттерн.»** – **measure, then build.** ⚠ The
  Slam is rank-gated, so a rank slip past its cut removes it mid-window. **The defect he is naming is
  not the gate, it is that resting COST him the entry and nothing warned him.** Check whether the
  vacation itself moved the rank (points decay over a rolling window) or whether the rank had already
  slipped. ⭐ His «не очень хороший паттерн» is the design complaint: a decision that removes content
  must be legible before it is taken, not after.

- [ ] **2. «Надо сделать предзагрузку картинок для оффлайн, у меня в ленте через одну черные плашки
  в сезоне»** – **build.** Every other card in the season feed renders black. PWA precache already
  exists (`118 entries` in the build log); the feed's imagery is evidently not in it.

- [ ] **3. «В разделе календаря недели всё ещё нет блоков про съёмки… а если это выпадает на неделю
  турнира, то на затраченной энергии должно отражаться. А, увидел на пустой неделе, но на
  чемпионатской нет. Может сделать возможность переноса съёмки или всё-таки жарить прямо с
  чемпионатом с последствиями.»** – **build + ask.** ⚠ Round 28 #1/#6 shipped the shoot week and
  **deliberately exempted a tournament week** – the engine pays the masseur nothing there and the
  builder recorded «lights and flights, not his table». **He has looked at that exemption and does not want it** –
  «но она же осталась на турнирной неделе, значит надо понять как с ней быть».

  ⚙ **HIS RULING, and it is better than the fork I offered him.** I asked him to pick between moving
  the shoot and paying for it; he says the CHOICE BELONGS TO THE PLAYER, and named all three arms:

  1. **cancel the tournament**;
  2. **cancel or move the shoot** – ⚠ and cancelling «явно должны быть последствия какие-то», moving
     presumably not;
  3. **shoot and play in the same week**, paying for it in condition – his own figure: **«+1 в день,
     т.к. съемка занимает не один час, то нагрузка будет мощной на всю неделю»**.

  ⭐ So this is a decision surface, not an automatic resolution. The week must ASK.

- [~] **4. «По победам как-будто по-лучше стало»** – ⚙ **his own verdict, recorded, nothing to build.**

- [ ] **5. «В магазине всё ещё не хватает яхт, самолётов и стойки академии»** – **build.** Slice 1
  (cars) shipped; the spec [the-shop-2026-08.md](../specs/the-shop-2026-08.md) already carries yachts,
  the parents' plane and the academy. This is round 28 #7 with the queue position now given.

- [ ] **6. «Листалка на 4 недели кажется весьма бессмысленной: у меня был слот 6 недель, я нажал,
  увидел сообщение о конце года и странное окошко с отчётом о двух пройденных днях, а календарь так и
  остался на 51й неделе. Наверное эта кнопка будет полезна только для длительных травм, и то не точно.
  Её необходимость под большим вопросом.»** – **build (bug) + ask (keep it at all).** ⚠ Three separate
  wrongnesses in one press: it stopped at the year end, it reported **two days** for a six-week slot,
  and **the calendar did not move**. Fix the lie first; whether the control survives is his call.

- [ ] **7. «А что у нас со спонсорами вообще, кстати? Кроме часов за 20к есть ещё кто-то и когда
  появляется? Мы что-то говорили о больших чеках вроде.»** – **answer.** Read the ladder out of the
  code and tell him what exists, at what standing each rung opens, and what the largest cheque in the
  model actually is. ⭐ Pairs with 15, which is the same question from the other side.

- [ ] **8. «При клике на Next Tournament на главном экране давай сделаем может быть какой-то
  информационный экран? Например со списком соперников, прогнозами и комментариями тренера ещё
  какой-то информацией о турнире, картинкой с ним… Можно частично переиспользовать экран начала
  турнира»** – **build.** ⭐ His own implementation hint is the cheap road and should be taken.

- [x] **9. «В строке с машиной и другими вещами `Worth now / paid $60,000 / $59,361` – давай
  последнюю цифру сделаем либо белой, либо жёлтой, с красным перебор.»** – **build.** One colour token.

  ⚙ **SHIPPED – WHITE, and the token was already named for this.** `StatRow`'s three tones are the
  app's money vocabulary and each has a documented sense: `negative` is `--money-out`, **money
  LEAVING** – a bill, a fare, a cheque – and that is what was wrong here, not the shade. What the
  figure states is what the thing IS WORTH, which is a BALANCE, and `StatRow` already has the word
  for that: `plain` = «a number with no direction (a count, a balance)», painted `--ink`. So it is
  the existing palette's white and no colour was invented.

  ⚠ **AND THE DIRECTION IS NOT LOST.** It moves one line down to `.shop-row-change`, the SIGNED
  difference, which is the row that is genuinely about a direction – a car that lost $639 still says
  so in red under a worth that is now just a worth. Mounted assertion on the rendered class token
  (`tb-statrow--plain`, and NOT `--negative`) in `tests/component/round29-shop-topup.test.ts`;
  mutation-verified by restoring the old ternary, which reddens that arm alone.

- [x] **10. «По результатам w500 мне пишут Income +$29,046 · Spent -$6,883 · Balance +$22,164 ·
  Her cut 50% $27,600 – это не 50% по сравнению с income»** – **build (bug).** ⚠⚠ **$27,600 against an
  income of $29,046 is 95%, not 50%.** Either the label lies about the base or the split is wrong;
  round 28 #15 has just widened her cut to sponsor cheques and **is live in this save (v65)**.

  ⚠⚠ **MEASURED, and it is neither of the two readings we had.** I first called it 95% by dividing
  where I should have added; he corrected me – «это 27,600 + 29,046, это НЕ 95%, но и не 50%». The
  save says a third thing. Across all 27 weeks that credited her:

  | week | prize | her cut | bps | ratio |
  | --- | --- | --- | --- | --- |
  | 730 | $62,000 | $74,400 | 5000 | **1.20** |
  | 733 | $82,500 | $99,000 | 5000 | **1.20** |
  | 738 | $23,000 | $27,600 | 5000 | **1.20** |
  | 749 | $95,000 | $114,000 | 5000 | **1.20** |
  | 754 | $41,000 | $49,950 | 5000 | **1.22** |
  | 767 | $13,250 | $16,650 | 5000 | **1.26** |

  **The field states `bps: 5000` and pays 120% of the prize – more than the whole prize.** 24 of 27
  weeks land on exactly 1.20 and two drift to 1.22 / 1.26, so there is a VARIABLE term, not merely a
  wrong constant. ⚠ Candidate, unverified: the kit contract's `bonusShare: 0.2` (a 20% bonus on prize
  money from w75 up). **The base must be identified before anything is changed** – I have already been
  wrong once on this item.

  ⭐ Two weeks (728, 741) credit **$750 with a prize of zero** – the sponsor-cheque cut of round 28 #15
  doing its job, and evidence the two paths are separate.

  ⚙⚙ **SHIPPED, AND THE ANSWER IS: THE LABEL LIES, THE SPLIT DOES NOT.** The base was found before
  anything was changed, by driving the engine rather than by reasoning from the ratio – which is what
  produced both earlier wrong readings.

  **What the writer actually does.** `finalizeTournament` credits the family `prize − herShare`, so
  the ledger's `prize` row is **already net of her cut**. `kidShare.cents` is her half of the
  **gross** – and of a second gross cheque, the kit contract's result bonus, which `resultBonusFor`
  computes as `bonusShare × TIERS[tier].prizeCents[finish]`, i.e. a fraction of the same gross prize
  table, and which round 28 #15 correctly split too. At the cap (5000 bps) on a `tour` kit deal
  (`bonusShare: 0.2`) that is `0.5P + 0.5×0.2P = 0.6P` of cut against a `0.5P` prize row: **ratio
  1.20, with no variable term anywhere.**

  **All six of his rows reconcile to the cent**, and the two "drifting" ones are not drift – they are
  the quarterly retainer's own $750 landing on a tournament week. Weeks **728 / 741 / 754 / 767 are
  thirteen apart to the week**, which is `WEEKS_PER_YEAR / 4`, the retainer's cadence:

  | week | gross prize | her prize cut | her bonus cut | retainer cut | total | he saw |
  | --- | --- | --- | --- | --- | --- | --- |
  | 738 | $46,000 | $23,000 | $4,600 | – | **$27,600** | $27,600 |
  | 754 | $82,000 | $41,000 | $8,200 | $750 | **$49,950** | $49,950 |
  | 767 | $26,500 | $13,250 | $2,650 | $750 | **$16,650** | $16,650 |

  ⚙ **SO THE MONEY IS RIGHT AND THE SENTENCE WAS NOT.** «Her cut 50%» stood beside `Income`, which is
  the family's **remainder of the very cheque being split** – the one figure it can never be 50% of.
  The base, his week 738's $55,200, was the only number never on the card. `FinanceWeek.kidShare` now
  carries `baseCents` (the gross, **summed** across the week's cheques, **carried and never re-derived
  by division** – that division is the penny `kidPrizeShareCents` forbids and the arithmetic that
  misled us twice), and the memo reads **«Her cut 50% of $55,200 – $27,600»**.

  ⚠ **FORWARD-ONLY, as required.** `baseCents` is optional and absent means «not recorded». No save is
  back-filled, no ratio invents a base for a week already banked, and those weeks keep the exact line
  they printed before. **`SAVE_SCHEMA_VERSION` STAYS AT 65** – this is the optional widening
  `WorldEvent.entryRef` writes the rule for in the same file («absent is exactly what every historical
  save already means, so no migration is owed, no golden fixture is added and `SAVE_SCHEMA_VERSION`
  does not move»), with commit `2763caa` as the recorded precedent. Saying it out loud because the
  brief pre-authorised a v66: a bump here would have owed a migration that **must not** back-fill,
  and a golden fixture pinning nothing.

  ⚠ Evidence: `tests/round29-kid-cut-base.test.ts` (7 arms – drives a real prize week with a live kit
  deal, asserts her credit is the stated share of the recorded base, and reproduces his 1.20) plus a
  re-aimed and strengthened arm in `tests/component/round29-shop-topup.test.ts`' sibling,
  `tests/component/week-recap-kid-share.test.ts`, which now pins the LABEL against that same base.
  Mutation-verified: rebuilding the original defect (`familyShare` as the base) reddens the identity
  arm and the label arm **together**; dropping the base from the memo reddens the mounted arm alone.

- [x] **11. «Index fund хотелось бы иметь возможность докупать, предполагаю, что Savings deposit
  будет вести себя так же – тоже надо исправить. А ещё было предложение делать доходность индексного
  фонда плавающей, на сколько я помню, мы это делали? Иначе не очень понятно зачем вообще Savings»** –
  **build + answer.** Top-ups for both instruments; and answer whether the floating yield shipped.
  ⭐ His «иначе непонятно зачем вообще Savings» is the design test the answer has to pass.

  ⚙ **TOP-UPS SHIPPED, BOTH INSTRUMENTS.** `buyAsset` now treats an owned `stake: 'open'` rung as a
  top-up and only a `'fixed'` one still refuses – **the predicate is the STAKE, never a list of two
  ids**, so a third investment added to the catalogue tomorrow tops up because of what it is. No new
  command: it is the same decision out of the same wallet through the same validation, and
  `world/constants.ts` calls that guard list «short on purpose».

  ⚠ **THE HARD PART IS THE COMPOUNDING, NOT THE WALLET.** Value is `basis × (1+r)^years` off ONE start
  week, so money added in season six must not be treated as though it had been growing since season
  one. A top-up **rebases**: `OwnedAsset.basisCents` becomes today's worth plus the new money and
  `basisWeek` restarts the clock – exactly `V(1+r)^t + T(1+r)^t`, with no second value model.
  `paidCents` meanwhile keeps accumulating the **cash**, so `changeCents` stays the honest lifetime
  P&L and the shelf's «the ledger shows the loss to the cent» survives a top-up; `boughtWeek` is not
  rewritten. Both new fields are optional widenings, **so `SAVE_SCHEMA_VERSION` stays 65** – same rule
  and same precedent as item 10 above.

  ⚠ Evidence: `tests/component/round29-shop-topup.test.ts` tops up each instrument **twice**, with
  real ticked weeks between, and asserts the wallet moved by exactly each tranche and that each
  tranche compounded over **its own** span. Mutation-verified: back-dating the new money to the
  original purchase reddens the two arithmetic arms alone – the failure a screen test could never see.

  ⚙⚙ **HIS QUESTION, ANSWERED FROM THE CODE: THE FLOATING YIELD DID NOT SHIP.** Neither instrument
  floats. `assetValueCents` is `round(basis × (1+annualRateBps/10_000)^years)` – deterministic
  compound interest, **zero draws**, and `world/shop.ts`' own header says it: «no drift, no shock, no
  freeze». The economy catalogue says the same thing beside the fund's own blurb: «§3a's index fund
  *can be DOWN for a whole season and still be the right holding* – that is **slice 2's drift, and
  until it lands the blurb may not describe a movement the engine does not make**». So he is
  remembering the **proposal**, which is real and is written down; it was never built.

  ⚙ **AND HIS TEST IS THE RIGHT ONE – AS SHIPPED, SAVINGS IS DOMINATED.** Both are `stake: 'open'`,
  both are sellable **any week** (`sellableAsset` returns true unconditionally – no lock-up, no
  freeze), and neither can lose a penny. The only differences are the entry minimum and the rate:

  | | entry | rate | can it fall? | locked? |
  | --- | --- | --- | --- | --- |
  | A savings deposit | $1,000 | +2% a season | no | no |
  | An index fund | $5,000 | +7% a season | **no** | no |

  So the deposit's ONLY remaining reason to exist is **a stake between $1,000 and $4,999** – below the
  fund's door. At $5,000 and up the fund beats it on the single axis that differs, with no offsetting
  risk, because the risk is exactly the unshipped drift. **His «иначе непонятно зачем вообще Savings»
  is correct as a verdict on the shipped state**, and the deposit stays decorative until either the
  fund can genuinely go down or the deposit gets something the fund has not.

  ⚙⚙ **AND HE HAS ALREADY ANSWERED IT – 28.08, so this is no longer an ask.** «В реальности на
  текущем счете нет процентного дохода, максимум кешбек, и то не за все, **мы для этого делаем Savings
  как раз. Одни должны друг друга заменить.**»

  ⭐ **Savings is what the current account's automatic interest TURNED INTO.** That is the answer to
  «зачем вообще Savings» and it is a better one than either fork I was going to offer him: the wallet
  stops paying a wage, and the player who wants yield moves the money – which is a decision, which is
  the mechanic. ⚠ It also makes **this item the prerequisite for 12**, and it shipped first
  (`db6da62` before `74cb407`): removing the wage while the instrument replacing it could not be fed
  would have left the player with neither.

  ⚠ **WHAT REMAINS TRUE AND IS STILL HIS TO RULE ON is a narrower thing than «why does Savings
  exist»**: the index fund still cannot fall, so between the two instruments the fund is strictly the
  better holding above $5,000. That does not make Savings pointless any more – it makes the FUND
  under-priced for its risk-free-ness. Re-filed as ask **11b** in those terms, and the measurement of
  whether Savings actually covers what the interest paid is under item 12.

- [x] **12. «И я предлагал убрать авто начисление % на текущий счёт»** – ⚙ **his RULING**, and it
  settles round 28 #9, which was filed as an ask. Remove the automatic interest on the current
  account. ⚠ It is a large silent income line – measure what the economy loses before shipping, and
  say so, but the direction is decided.

  ⚙ **SHIPPED, AND MEASURED FIRST.** `resolveInterest` is gone from the weekly tick,
  `ECONOMY.savings` is deleted (not left at zero – a live balance constant that nothing charges is a
  decision nobody can find, and the next reader wires it back up believing it is a knob), and the
  term came out of `familyWeeklyIncomeCents` with it.

  ⚠ **THE BENCH, BOTH ARMS, 1,620 careers each** (`npm run bench:econ`, 18 presets × 30 seeds × 3
  horizons; arm A = this branch with the accrual, arm B = the same tree with it removed):

  | horizon | interest earned (arm A) | end-funds delta | blocks where funds fell | survivors |
  | --- | --- | --- | --- | --- |
  | **14→16** (junior sink) | **$2,137** mean ($243–$6,777) | **−$1,954** mean | **18 of 18** | 454 → 451 (**−0.7%**) |
  | 14→18 | $3,547 mean | +$1,812 mean | 12 of 18 | 311 → 310 (−0.3%) |
  | 14→20 | $16,181 mean | +$7,804 mean | 9 of 18 | 269 → 261 (−3.0%) |
  | **all** | – | – | – | 1,034 → 1,022 (**−1.2%**) |

  ⚠⚠ **READ THE 14→16 ROW AND DISCOUNT THE OTHER TWO.** The junior sink pays no prize money, so it is
  the only horizon where the two arms differ *by the interest and nothing else* – and there the answer
  is perfectly consistent: **every one of 18 presets loses money, mean −$1,954 a career.** Past 16 the
  arms diverge chaotically (deltas swing from **−$422,642 to +$640,444**, and the MEAN goes positive):
  a few dollars of funds changes an entry decision, which changes a result, which changes a prize
  cheque. Those numbers measure career divergence, not this change, and quoting the +$7,804 as «the
  economy gained» would be exactly the false-null trap CLAUDE.md's own note is about.

  ⚙ **VERDICT: NOT A BANKRUPTCY EVENT, so it ships.** −0.7% on the clean arm and −1.2% overall, and
  **survival ROSE in 12 of the 54 blocks** – impossible under a pure «less money» model, and the
  explanation is that the economy already has need-based backstops (the academy scholarship and the
  local sponsor cameo are both gated on the family being short) which absorb part of the loss. That
  is the opposite of a silent economy-wide punishment, so «мы ни за что не наказываем» is not
  breached.

  ⚠ **ONE CAVEAT THAT IS HIS TO RULE ON, and it is the honest half of this.** The replacement for the
  wallet's yield is the shelf – the deposit at +2% and the index fund at +7%, both of which item 11
  just made toppable – but `shopUnlocked` gates the whole shelf on the **professional** ladder. So in
  the junior years, which is exactly the horizon where the loss is cleanest and the family is
  poorest, **there is now no way to earn yield at all.** That is defensible (a fourteen-year-old's
  family is not an investor) but it should be a decision, not a side effect. Added to the asks.

  ⚠ **AND IT PARTLY UNDOES ROUND 21 #12, HIS OWN EARLIER RULING** – said out loud rather than left for
  him to rediscover. That item was «на счету 1млн, а элитного тренера какого-то нельзя брать», and its
  fix was to count the interest into the coach-affordability cap; on that million it was **$600/wk
  against the parents' $482**, more than half the family's weekly money. With the accrual gone the cap
  has to stop quoting it, so **a wealthy family will see Elite rungs flagged «over» again**. ⚠ FLAGGED,
  NEVER REFUSED – `hireCoach` does not consult the budget at all – so this warns, it cannot lock
  anybody out, which is what keeps it inside house law. The answer to the re-opened complaint is the
  shelf: a family that puts the million into the index fund is earning again, deliberately, and
  `householdWeekly` already shows that money in the household's week.

  ⚙⚙ **HIS SECOND RULING ON THIS, 28.08 – AND IT BINDS 12 TO 11.** «Здесь логика простая: в
  реальности на текущем счете нет процентного дохода, максимум кешбек, и то не за все, мы для этого
  делаем Savings как раз. **Одни должны друг друга заменить.**»

  ⭐ **So Savings is the REPLACEMENT, not a competitor** – the current account pays nothing because
  that is what a real current account does, and the player who wants yield MOVES money. That is the
  decision the mechanic exists to create, and it also **answers his own «иначе непонятно зачем вообще
  Savings»**: it is what the interest turned into. ⚠ Shipped in that order: **11's top-ups first
  (commit `db6da62`), 12's removal after (`74cb407`)** – removing the wage while the instrument that
  replaces it could not be fed would have stranded the player with neither.

  ⚠⚠ **AND HIS SHARPER QUESTION, MEASURED: CAN A PLAYER WHO MOVES HIS MONEY INTO SAVINGS LAND WHERE
  THE INTEREST USED TO PUT HIM?** Three arms, same seeds, 312 weeks (14→20), total wealth = wallet +
  shelf. Arm A on a control worktree (this branch with `74cb407` reverted, reader confirmed present);
  arms B and C on the branch; arm C moves every surplus above a $25,000 living reserve into the
  deposit each week the shop is open.

  | career | A – interest | B – neither | C – Savings | shop opens |
  | --- | --- | --- | --- | --- |
  | 25k middle · middle coach · grinder | $9,241 | $15,041 | **$15,041** | ⚠ **never** |
  | 120k wealthy · elite · grinder | −$37,044 | −$37,534 | **−$37,534** | w152, ⚠ **overdrawn** |
  | 8k working · self · player | $1,456,450 | $1,548,965 | **$1,914,678** | w122 |

  ⚙ **THE ANSWER IS: FOR ONE CAREER OF THREE, YES, AND HANDSOMELY – AND FOR THE OTHER TWO, NOT AT
  ALL.** Where the shelf is reachable and there is a surplus, Savings does not merely cover the loss,
  it beats it (**+$365,713, +23.6%** over arm B on the same code and the same dice). ⚠ But the gap is
  **structural, not a rate gap**, and it has two halves:

  1. **AVAILABILITY.** `shopUnlocked` gates the whole shelf on the **professional** ladder. The
     middle-family grinder above **never opened the shop in 312 weeks**, and the wealthy career was
     overdrawn when it did. The junior sink – the horizon where the loss is cleanest, at −$1,954 a
     career – has **no replacement at all**, and a career that never turns professional never gets one.
  2. **RATE.** On the same money the deposit pays **2.00%/yr against the current account's 3.17%**
     (`apyWeekly 0.0006` annualised), so it recovers **63%** of the removed rate. The index fund at
     7% would recover 221%, but he named Savings.

  ⚠ **NOTHING TUNED, per instruction.** Both halves are his to rule on – the availability half is
  filed as ask **12b** and is the sharper of the two, because no rate change fixes a locked door.

  ⭐ **CASHBACK – RECORDED, NOT BUILT.** «Максимум кешбек, и то не за все» is his reasoning for why a
  current account pays nothing, not a request. Filed here as a possible future line and deliberately
  left unbuilt: a small rebate on some spending categories would be the realistic replacement for the
  wage on the wallet, and it is the natural companion to 12b if he decides the junior years need
  something. **No code exists for it and none should until he asks.**

  ⚠ Guard tests **re-aimed, not deleted**: `tests/round9.test.ts`' R9-1 block now asserts the ABSENCE
  of everything it used to assert the presence of (six arms, including the zero-RNG arm re-proven
  against the step's removal, which is what keeps the frozen MAIN capture provably untouched);
  `tests/events.test.ts`' week-order pin is back to the parent contribution opening the week; and the
  three coach-cap arms now expect one stream instead of two. The **category** `'interest'` survives on
  purpose – every save already written carries rows under it and a career's own past has to keep
  rendering.

  ⚠⚠ **AND THE THREE FROZEN CAREERS WERE RE-STRUCK, WITH THE PER-KEY DIFF FIRST** (`tools/frozen-key-diff.ts`,
  control = this branch with `74cb407` reverted in a dedicated worktree, reader confirmed present on
  the control before measuring). The two grinder careers move **7 of 73 keys** – `careerTotals`,
  `events`, `financeWeeks`, `fundsCents`, `lastSeasonSummary`, `nextEventId`, `seasonHistory`: money
  and the money's paper trail, nothing else. The **player** career moves **26 of 72**, including
  `skills`, `results`, `kidRank` and `vacations` – ⚠ not a leak but the economy: that policy enters
  tournaments and books holidays out of the wallet, so a poorer family enters fewer and finishes
  elsewhere. An income change that could not reach a career's results would not be an income change.
  ⚠⚠ **`rngMain` is BYTE-IDENTICAL on all three arms** – the dice did not move, the decisions did, so
  input-independence holds and the frozen MAIN capture (41550 / `e6b0c709`) is untouched.

- [ ] **13. «А мы что-то перечисляем тренеру за финал каких-то турниров в итоге? Мне кажется эта
  информация стоит того, чтобы добавить её на странице тренеров»** – **answer + build.** Read the
  bonus rule out of the code, then surface it once on the coaches page.

- [ ] **14. «Ни одной победы в 45 году, только 2е место на 500 и 250 и 2 взрыва ярости за год по
  случаю полосы вылетов в 1м раунде – не самый удачный год для 23 ракетки мира»** – **measure.**
  ⚠ Round 28 measured the drought at 23.9% of seasons and **66.1% in the #81–120 band** – but he is
  **#23**, where our rate was 15.3% against a real 50%. **A title-less year at #23 is normal by the
  real censuses and abnormal by our own numbers.** Check which of the two his season actually is.

- [ ] **15. «И где все наши топовые спонсоры, интересно? Кроме Netrally, Baseline athletic, Play
  beyond? На других аккаунтах я помню один был мощный.»** – **answer/measure.** Same question as 7
  from the brand side: does the top of the brand ladder ever open, and what gates it.

- [ ] **16. ⚠ «письмо с Заголовком Entries Suspended – я точно это заводил уже в одном из предыдущих
  раундов, мне кажется этот заголовок сбивает с толку… Может его как-то и озаглавить про топ-50
  правила»** – **build**, and ⚠⚠ **CHECK THE EARLIER ROUND FIRST.** If he filed it before, this is
  `[!]` REOPENED and the ledger must say what the first fix aimed at and why it missed. The letter's
  body is the top-50 mandatory regime (4 Slams, 8 × WT1000, 6 of 10 × WT500, 2 penalty points, 10
  points suspends for 4 weeks); the title announces a suspension that has not happened.

- [ ] **17. «проверь предыдущие раунды на предмет "что забыто и не сделано" пожалуйста»** – **audit.**
  ⭐ Runs FIRST, because its output changes what the rest of this round should do.

- [ ] **19. ⭐ «вроде бы я всё мержил и обновление прилетало на телефон, где информация об этом?
  может быть стоит какую-то версию добавить в настройках внизу строчкой? И в pull-request скилле
  обновлять при деплое?»** – **build, and it closes a hole that just cost us.** ⚠⚠ **I asserted his
  save predated round 28 and was wrong** – it is schemaVersion 65, i.e. round 28 was in it. Nothing
  on his screen says which build he is playing, so every defect he reports carries an unknown.

  What it owes: a version line at the foot of Settings, updated at deploy, identifying the build
  precisely enough to map a report onto a commit. ⭐ Recommend a short commit SHA plus the date rather
  than a semver – a semver says what we intended, a SHA says what he is running, and it is the second
  question we keep needing. Pairs with 18: the `pull-request` skill updates it.

- [ ] **18. «добавить в скилл pull-request проверку несделанных пунктов из раунда»** – **build (skill).**
  ⭐ 17 and 18 are the same instinct: he has noticed that items go quiet, and wants the PR step to
  catch it mechanically rather than by my memory.

---

## Folded in from the audit – same surfaces, near-zero marginal cost

⭐ Both were found by item 17's audit (`docs/rounds/AUDIT-2026-08-28.md`) on files this wave was
already inside, so they cost the wave almost nothing and they shrink the audit's own open list.

- [x] **round 27 #8 – two screens said «за сезон» and meant different seasons.** His report was «в
  History расход за сезон написан 36 тысяч, а на вкладке расходов 25 тысяч» and his conclusion «явно
  что-то не ладно с нашей математикой». ⚠⚠ **THE ARITHMETIC WAS NEVER WRONG.** Both figures were right
  about DIFFERENT seasons: the spending tab folds the season **still running** (34 of 52 weeks on his
  save) while History lists seasons that have **wrapped** – and neither surface said which. A label,
  not a repair, exactly as the audit priced it. The period switcher now reads **«Season so far»** and
  the history card **«Completed seasons»**. Mounted arm in
  `tests/component/round29-shop-topup.test.ts`.

- [x] **round 17 #28 – `TierGuide.vue:49` was still printing `$0`.** Flagged 13.08, the item marked
  `[x]`, and this last surface never fixed – the audit called it «half-false» and it was. `shared/money.ts`
  already carries the rule («a fact – "no entry fee" – and a missing value – "$0" – must not look the
  same») and the only rung it can fire on is the slam, where charging nothing is the real rule. The
  cell now reads **«none»**. ⚠ Not `entryFeeLabel` here: this is a `.num` cell under a header that
  already says «Entry fee», so the helper's full sentence would have printed «no entry fee» under
  «Entry fee» and wrapped a numeric column. Mounted arm in the same file, mutation-verified.

---

## Asks – batched, so he answers in one pass

| | the choice |
| --- | --- |
| **6** | the multi-week skip: **(A)** repair it (it must move the calendar and report the real span), **(B)** delete the control, **(C)** keep it only for an injury lay-off |
| **11** | ~~Savings vs Index fund: what makes Savings worth holding once the fund can be topped up~~ – ⚙ **ANSWERED BY HIM, 28.08**: «мы для этого делаем Savings как раз, одни должны друг друга заменить». Savings is what the current account's interest turned into. |
| **12b** | ⭐ **THE JUNIOR YEARS NOW EARN NOTHING AT ALL** – the shelf replaces the wallet's yield but `shopUnlocked` gates it on the professional ladder. **(A)** leave it (a fourteen-year-old's family is not an investor), **(B)** open the two investment rungs early, **(C)** open them at some earlier mark |
| **11b** | ⭐ **RE-FILED after his «одни должны друг друга заменить» answered the bigger question.** The floating yield never shipped, so the index fund cannot fall – it is a risk-free 7% beside a risk-free 2%. **(A)** ship slice 2's drift so the fund really floats, **(B)** leave it, and accept that the fund is the strictly better holding above $5,000 |
