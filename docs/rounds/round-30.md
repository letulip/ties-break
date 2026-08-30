---
type: round-ledger
status: current
area: rounds/30
canonical: false
last-reviewed: 2026-08-30
---

# Round 30 – an intermediate round, 17 items + CI (30.08.2026)

Status: `[x]` shipped · `[~]` answered, nothing to build · `[>]` in flight · `[ ]` open · `[?]` his ·
`[!]` REOPENED.

**His words: «вот еще промежуточный раунд в догонку к 29му».** So it is its own round, and it ships
on **the same branch** – his standing instruction «докидывай в 29 раунд в гите всё скопом».

⚠ Several items are REGRESSIONS from round 29's own work, played and found within hours. They are
marked `[!]` and each names what shipped and why it missed – that is the point of the mark.

---

- [x] **1. «Поправить результаты недели после чемпионата, вернуть все цифры и надписи как было**:
  Income / Spent / Balance, ниже her cut **без жирного шрифта**, ниже coach's cut если есть результат.
  Всё остальное лишнее, дублирующее и сбивает с толку. **Other income странно звучит**, можно
  переименовать… например Family income и тогда эту строчку тоже оставить здесь» – ⚠⚠ **REOPENED
  against round 29 part-two #1.** He asked for one prize figure so the rows add up; the fix shipped
  five rows (`Before her cut` / `Her cut` / `Other income` / `Spent` / `Balance`) and **that is more
  than he wanted, not less**. Restore the three-row shape, her cut unbolded beneath it, the coach's
  cut when there is a result, and rename `Other income` → `Family income`.

  ⭐ And his own extension: «если она на самокоучинге, то это тоже актуальная строчка по аналогии
  с тренером» – a self-coached family still owes itself the line.

  **SHIPPED, and it is FEWER lines than what it replaces.** `WeekRecapCard.vue`'s Finances tile:

  ```
  Income          +$X
  Spent           -$Y
  ────────────────────
  Balance         +$Z
  Her cut 50% – $N into her own account.        <- a memo, and NOT bold any more
  Coach's cut 10% – $M, inside Spent above.     <- only on a week with a result
  Family income   +$K                           <- the renamed `Other income`
  ```

  `financeRows` is the Income / Spent pair on **every** week and every save again – the branch that
  produced `Before her cut` / `Her cut N%` is gone. ⚠ **Her cut had been on screen twice**, as a
  signed row and as the memo below it, which is exactly the «дублирующее» he names. `Family income`
  keeps the old `Other income` figure to the cent (`income − (base − cut)`) under the name he chose,
  and it sits **below the balance with the memos, outside `.recap-rows`** – it is a SLICE of the
  Income row above, so a term beside Income would count the family's own money twice.

  ⚠ **The round 29 #10 pin is re-aimed for the second time and still alive.** It exists so a stated
  «50%» can never drift from the money beside it. #10 put it on the memo, part two #1 moved it onto
  two rendered rows, and this reshape takes the base back off the card – so it now reads the RATE off
  the screen and the BASE off the wire, and adds a tie to the engine's own ramp
  (`kidPrizeShareBps`, which reads `ECONOMY.kidShare` and nothing else). It never divides cents by a
  rate to invent a base, which is what `accrueKidShare`'s header forbids. The coach's twin pin
  (`staffResultShareBps`, `round29p2-coach-cut-weekly.test.ts` §3) was untouched by the reshape and
  is green as it stands.

  ⚠ **THE SELF-COACHING LINE: the engine pays a self-coached family NOTHING, and I did not invent a
  payment.** `finalizeTournament` gates it on a filled seat –
  `track === 'wta' && world.coachId !== null` – and that gate is **your own round-24 ruling**, quoted
  in the code beside it: «a self-coached family owes no coach share and an empty table no masseur
  share». There is already a green test arm for it («a self-coached family owes nothing, and the card
  is silent for them too»). So the LINE may well be right while the MONEY is zero, and printing
  `Coach's cut 10% – $0` today would break the house rule that a fact and a missing value must not
  look the same (`shared/money.ts`). **Two different asks, and both are yours to make:**
  *(a)* a self-coached family PAYS ITSELF the result share – an economy change that overturns round
  24 and moves real cents; or *(b)* the line appears as a note with no figure, saying the share
  stayed in the family. Say which and it is a small build either way.

  ⚠ **Two things I did NOT touch, flagged rather than guessed at** (invariant 4 binds a deletion as
  hard as a rename):
  - the foot «The income above is what the family kept.» still fires exactly where it did – a week
    with a cut and no recorded gross, i.e. one your save banked before round 29 #10. You listed the
    lines you want and did not name this one. Say the word and it goes.
  - the coach's memo **unbolded with hers**: they are one class, one idiom and the two lines you
    listed back to back. Two adjacent memos at two different weights would read as a defect. If the
    coach's should stay bold it is a modifier class and one line.

- [x] **2. «Если выбрать Do both для съёмок и турнира, то в расписании не отображаются съёмки»** –
  ⚠⚠ **REOPENED against round 29 #3.** The four-way clash shipped; its «do both» arm charges the
  7 condition and **draws nothing**. The same «you paid and cannot see it» shape a third time.

  ⚠⚠⚠ **THIS IS THE THIRD «YOU PAID AND CANNOT SEE IT» OF THE MONTH, AND THE REPETITION IS THE
  FINDING – not this one bug.** Three times in four weeks, in three different files, one shape:

  1. **round 29 #3 – the shoot week's MASSEUR.** `masseurSessions` carried a `&& !shooting` the
     engine never had, so the salary was charged on a shoot week and none of his days were drawn.
  2. **round 29 P13 – the tour week's MASSAGE DAYS.** The weekly rung's 2/4/7 were laid over a week
     whose plan is not spent, so the table landed on the travel day and the practice day and missed
     every match of the week at the entry rung – while `masseurTourWeekCents` billed matches played.
  3. **this one.** `answerShootClash`'s «do both» arm charges `clashConditionPerDay × 7` and latches
     the week; `calendarWeekFor`'s trip branch **returned before `shoot` was ever filled in**, so the
     grid drew an ordinary tournament week and the charge had no picture at all.

  One rule was broken all three times and `weekGrid.ts` already states it: **«the picture is the same
  sentence the sim charges for»**. Worth reading before the next block is added, not after – and
  worth a standing habit: **when a mechanic charges, ask what draws it, in the same commit.**

  **SHIPPED.** `TripFacts` gains `shoot`, `calendarWeekFor`'s trip branch fills it from the same
  `shooting` fact every other branch already reads, and `tripMatchDay` hangs a two-hour `Shoot`
  block on the end of each match day.

  ⚠ **On the match days, by the same mechanism as the press hour and the table**, and that is the
  only rule that always draws SOMETHING: from five rounds up a trip has no practice day left to give
  (`tripArcFor`'s `hits` is 0 at the WTA main tour and above, and a Slam is seven match days), so a
  rule hanging the shoot on the arc's free days would draw nothing at exactly the rungs a campaign is
  written around – this item's own defect, rebuilt.

  ⚠ **Last in the day, behind the order you ruled in #17.** Match → conference → massage → the
  brand's hours. Two hours and not six: `SHOOT_DAY` is a whole working day because on an ordinary
  week the call sheet owns the day, and here the draw owns it – «the shoot never pretends to own the
  week» is the mechanic's own design. It is also what keeps the day inside the grid: the longest
  match day becomes 10–18 and the Slam's evening flight still has 18–19, nothing shortened.

  ⚠ **No new snapshot field and no schema move, and that is an ARM rather than a claim.**
  `shootClashAccepted` is world state and is not on the wire; it does not need to be, because the
  other three answers REMOVE the collision – `withdraw` cancels the entry, `move-shoot` and
  `cancel-shoot` take the week out of `shootWeeks`. `tests/component/round30-do-both-shoot.test.ts`
  §2 drives **all four** answers through the real command and reads the grid back, so «an entered
  trip AND a named shoot week» is proved to be the «do both» week and nothing else.

  ⚠ Display only – both files are `src/composables/`, no engine call, no RNG stream, no schema.
  Four mutations, each watched: `shoot: shooting → false` (the defect, 5 red), the block pushed ahead
  of the press hour (2 red), its span grown to 5 so the Slam's Sunday overruns the grid (2 red), and
  the shoot hung on every day of the arc instead of the match days (3 red).

  ⚠ **What I did NOT add:** the tournament week's read-out still says only «She is away at X – the
  draw owns the week.» A sentence naming the brand would be new copy you did not ask for
  (invariant 4). Say the word and it is one line.

- [x] **3. «Странная серая нечитаемая надпись над кнопками… Quiet stretch ahead… Идея хорошая,
  реализация не очень. Нам в это время приходят письма и идёт запись на новые турниры – давай вообще
  эту кнопку про 6 недель уберём. Её можно оставить только на длинные травмы и с обязательным правилом
  "минус 1 день от длины окна" – иначе даже на турниры не записаться никак. Плохой паттерн»** –
  ⚙ **RULING, and it overturns my own standing decision.** I kept the control repaired and said
  deleting stays available; he has now looked at it in play and deleted it. **The multi-week skip goes
  except for a long layoff, and there it must stop one day SHORT of the window.**

  **SHIPPED, in three places.**

  1. **The quiet-stretch arm is gone.** `spanWorthOffering` was
     `calendarClearAhead(...) || longLayoff(...)` – both halves of your own 25.08 rule – and it is
     `longLayoff(...)` alone now. ⭐ **Your reason is the one the measurement could not see:**
     `calendarClearAhead` asks whether an EVENT is dated in the window, and a quiet fixture list is
     exactly when the letters arrive and the entry lists open. The stretch was never quiet; only the
     calendar was.
  2. **The skip stops one week short of the window.** `spanWeeksFor` takes
     `min(clear weeks, weeksRemaining − 1)`, so a seven-week layoff buys six and a week of the
     window always survives to enter something in – «иначе даже на турниры не записаться никак».
     ⚠ The injury is a REQUIRED argument now, not an optional one: a caller that forgot it would
     silently get the pre-ruling answer, which is the control you deleted. Off a layoff it returns
     **0**, so the two rules agree by construction – no layoff, no skip, from either side.

     ⚠⚠ **ONE READING TO CONFIRM: «минус 1 день» is built as MINUS ONE WEEK.** The control is
     week-granular end to end – the layoff window is `weeksRemaining`, the press buys whole weeks,
     and there is no day-sized skip to subtract a day from – so a literal day would round to either
     nothing at all or to the week I built. **The week is what makes your own reason true**
     («иначе даже на турниры не записаться никак»): a week of the window survives, and a week is the
     unit an entry list or a letter is answered in. If you meant something else by «день», say so –
     it is one constant.
  3. **The first-use line is gone**, with the control it explained. It opened «Quiet stretch ahead»,
     and there is no quiet-stretch span left for it to introduce – a muted sentence is fixable, a
     false one is not. `.span-hint`, its watermark and the `markSpanHintUsed()` call went with it.
     ⚠ The watermark key `tb:spanHintUsed` is deliberately NOT reused: it is already spent in your
     save, so a future first-use line must take its own key.

  ⚠ **Every guard is re-aimed, none deleted** – they are the record of what the control used to do:
  - `round26-span-gate.test.ts` arm 1 is **inverted**: it still measures that those weeks really are
    empty, and now asserts an empty window offers nothing – with the layoff arm firing on the very
    same week, so it cannot pass on a control that has simply stopped existing.
  - its measurement arm is **three rulings deep** now: 204 / 208 weeks under the first pass, 5 under
    round 26 #1, **0** on a healthy career under yours.
  - `round29-span-repair.test.ts` keeps its whole chain (six on the label, six on the press, six on
    the calendar, six on the card) – the fixture gained a seven-week layoff, so the numbers did not
    move and only the reason the pill exists did. Its first-use block is **inverted** into the guard
    that would catch the sentence coming back.
  - `r2-13-span-report.test.ts` and `round26-span-gate-ui.test.ts` reach the two-control bar through
    a long layoff instead of an empty calendar; every width, order and mutation arm is untouched.

  ⚠⚠ **One mutation is worth reading, because it was green when it should not have been.** Putting
  the deleted arm back left the pill absent and the case passing – `spanWeeksFor`'s window guard was
  catching it too. Two rules, one visible effect, and a case that reads only the screen cannot say
  which of them it is testing. The arm now pins `spanWorthOffering` itself as well as the screen.

  ⚠ **What is NOT deleted:** `calendarClearAhead` and `QUIET_WINDOW_WEEKS` survive, unreferenced by
  production code, carrying their measurement (0 / 900 weeks on the literal reading, ~2 % on hers)
  and a ⚠ note saying they are superseded as a gate. If you want the rule back it is a one-line
  change; say so and it returns. Deleting them would have thrown away the evidence for a ruling you
  might revisit.

- [x] **4. «В Family budget вкладка This season изменилась на So far. Я это не просил. Верни как было
  пожалуйста и запрети на уровне документации и спек агентам самовольно изменять вординг»** –
  ⚠⚠ **REOPENED, and it is a HOUSE-LAW item, not only a string.** Round 29's folded-in fix for round
  27 #8 renamed the tab while solving a different complaint. **Restore `This season`, and write the
  prohibition into `CLAUDE.md`**: an agent may not change user-facing wording it was not asked to
  change, even while fixing something adjacent.

  **SHIPPED.** `MoneyScreen.vue`'s `WINDOW_OPTIONS` reads `{ label: 'This season', short: 'This
  season' }` again – exactly the pair `db6da62` overwrote. One line of copy; the rest of the diff is
  the record of why.

  ⚠ **ROUND 27 #8 IS STILL TRUE AND STILL UNSOLVED, and restoring the word does not re-open it.**
  His #8 complaint was real – «в History расход за сезон написан 36 тысяч, а на вкладке расходов
  25 тысяч» – and **the arithmetic was never wrong**: the two figures are each right about a
  DIFFERENT season (this switcher folds the 52-week block still running; the history card lists
  seasons that have wrapped). **The rename was never the fix.** Renaming the tab answered a question
  he had not asked and left the one he did ask exactly where it was, so putting the word back costs
  nothing that was ever earned. #8 waits for him to choose a repair.

  ⚠ **One half of that rename is still standing and I did not touch it.** The same commit also
  changed the history card's eyebrow `Every season` → `Completed seasons`. He named only the tab, so
  reverting the eyebrow would be a **second** unasked wording change – invariant 4 binds the revert
  as hard as the rename. Flagging it rather than moving it: **say the word and it goes back.**

  ⭐ The round-29 pin that demanded `So far` and forbade `This season` was **re-aimed, not deleted**
  (`tests/component/round29-shop-topup.test.ts`) – it now guards the restored word against the next
  agent who finds it reads better another way, and it carries the history of what it used to assert.
  Mutation-verified: with the label put back to `So far` it fails on `expected '12 weeks So far' to
  contain 'This season'`.

- [ ] **5. «Внутри Bills и Shop сделать дополнительные вкладки как на экране Spending (12 weeks/So far)
  для каждой категории.** Для Bills – Her Kit / Advs Portfolio. Для Shop – сверху плашкой **The shelf**,
  ниже в ряд **Invest / Cars / Property / Business (Academy is subdivision inside) / Water / Air**.
  Для каждой карточки свой арт, карточки лежат **без общей подложки**, примерно как на экране Season» –
  **build.** ⚠ Art is his; use the documented fallback.

- [ ] **6. «Переделать экран при нажатии на плашку Next tournament на Home** – убрать рамку, картинку
  турнира квадратной (по примеру главной), часть описания на картинке, часть ниже… The read можно на
  картинке, раунды отдельной плашкой ниже на всю ширину с отступами, погоду и поездку тоже на картинку,
  4 иконки под картинкой просто в ряд без плашки, план тренировок внизу остаётся как есть» – **build.**
  ⚠ Round 29 part-two #8 built this panel by reusing the tournament splash; this is its redesign.

- [ ] **7. «Что-то не так с попапом "теперь каждый год начиная с 29 лет" – звучит как механический
  приговор безысходности пока что, надо что-то с этим сделать»** – **build (copy).** ⭐ The mechanic is
  the retirement corridor and it is correct; what is wrong is that it reads as a sentence passed rather
  than a fact about age.

- [ ] **8. «Merch brand давай предложим пользователю несколько вариантов именования при покупке…
  один из вариантов "ввести своё название" – это придаст +100 к индивидуальности сразу. Среди вариантов
  по дефолту могут быть инициалы ребёнка или что-то связанное с именем или фамилией»** – **build.**

- [ ] **9. «сам Merch brand тоже вполне может расти в цене как бизнес по какой-то логике, похожей на
  привязку к её рекламе и результатам. Можно провести анализ доходов и стоимости бренда RF (Roger
  Federer) для референса»** – **research, then build.** The brand becomes an asset with a VALUE, not
  only an income line.

- [ ] **10. «И нейминг для академии тоже по принципу бренда, как раз одним из вариантов можно
  предложить уже существующее название бренда (если он есть) или снова "ввести своё"»** – **build**,
  with 8.

- [ ] **11. «И как будто бы Holds its value странно звучит тоже – это напрямую значит, что оно
  обесценивается, а это вроде бы не совсем так»** – **build (copy).** ⚠ Check what the engine actually
  does to that asset before rewording – if it really does hold value, the words are wrong; if it
  depreciates, the words are right and the DESIGN is the surprise.

- [~] **12. «На 30 лет снова "один день вместе" =) давно не было, но я ещё понаблюдаю»** – ⚙ **his own
  hold.** Round 27 #7 shipped a one-birthday cooldown on the VOICE (longest run 4 → 1, share 30% → 24%);
  a recurrence at a 30-year gap is inside that. He is watching. Nothing to build.

- [ ] **13. «Почему-то merch brand приносил 600+, а через несколько месяцев стал 500+, хотя позиция в
  таблице уже 15»** – **measure.** ⚠ Merch income follows FAME, and fame DECAYS (halves over 104 weeks
  by design). A rising rank with a falling fame stock is possible and may be correct – but it may also
  be the decay outrunning what play can add. Measure before touching.

- [x] **14. ⚠⚠ «Волатильность индексного фонда какая-то очень большая по ощущениям +65/-15… И надо
  логику фонда переделать на покупку ДОЛЕЙ в фонде, как раз доли дадут возможность расти на горизонте
  и будут давать разные точки входа, как в жизни. Стоимость активов будет рассчитываться исходя из
  стоимости долей. Зашёл, когда доля стоила 4к, через десять лет она может вполне удвоиться. Или зашёл
  на пике при цене 7-8к и увидел просадку – имеешь возможность усредниться или зафиксировать убыток»** –
  ⚙ **RULING, and it replaces the model shipped hours ago.** Units, not a ratio: a unit PRICE the
  market moves, holdings measured in units bought at the price of their day. ⭐ That is what makes
  averaging down a real move rather than a feeling. And the volatility comes down.

  **SHIPPED.** `docs/specs/the-shop-2026-08.md` §14i is the record; the mechanic in one line:

  ```
  price(week) = $4,000 · 1.07^(week/52) · index(seed, week)     <- a unit, your $4k anchor
  buying      = money / price(THIS week)                        <- units, at your own entry
  worth       = units · price(now)                              <- and nothing else
  ```

  ⭐⭐ **THE REBASE IS GONE ENTIRELY, and it turns out that is a memory change rather than an
  arithmetic one.** Round 29's top-up restated the holding (`basis = worth today + new money`, clock
  back to this week) and its part sale scaled the same two numbers – and that arithmetic was
  **algebraically the unit model already**, which is why it never produced a wrong number. What it
  could not do is REMEMBER: folding every entry into one restated basis destroys the price you came
  in at in the very act of adding to it, so «усредниться» had nothing to average against. Units keep
  every entry, and `basisCents` and `marketRatio` are deleted with the mechanism.

  ⭐⭐⭐ **AND BOTH MOVES YOU NAMED ARE NOW MOVES.** The shop row gains ONE line –
  `12.47 units – bought at $4,012 each, $4,208 now` – and that is the only copy this item adds
  (invariant 4: nothing else on the row was touched, re-worded or removed).
  - **усредниться**: buy while today's price is under your average, and the average really falls.
    Measured: the price is lower a season after entry in **29.4%** of entries, and that second
    tranche is worth **6.4%** more at ten years than doubling in at the peak.
  - **зафиксировать убыток**: sell part at today's price. The realised loss goes to the ledger to the
    cent, and ⚠ **the average price does not move** – the sale takes the same fraction of the cash and
    of the units – so what is left says the same thing it said before and the next decision is the
    same decision.

  ⚙ **THE VOLATILITY: `volBps` 1_800 → 900, HALVED** (4,000 seeds, 228,000 rolling seasons,
  48,000 holdings per horizon – §14h's own sample shape):

  | | round 29 | now |
  | --- | ---: | ---: |
  | seasons negative | 30.8% | **24.5%** – «one year in four» |
  | worst season | −39.9% | **−32.5%** |
  | season sd · p5 · p95 | 16.8% · −18.3% · +38.9% | **15.1% · −16.8% · +36.6%** |
  | worst drawdown | −40.1% | **−33.6%** |
  | beats the deposit 1 / 3 / 5 / 10y | 57.2 / 84.0 / 86.8 / 98.9% | **62.0 / 90.2 / 87.9 / 99.7%** |
  | crises: interval · depth · first-season | 4.01y · −22.5% · 49.7% | **unchanged – your numbers** |

  ⚠⚠ **THE SAFETY PROPERTY, RE-DERIVED RATHER THAN ASSUMED, and it came out BETTER.** Round 29 proved
  calm-water ten-year holdings beat the deposit for every seed and measured the trough-sell tail at
  **1.10%** (529 of 48,000), which you accepted. At vol 900 the same measurement reads **0.325%
  (156 of 48,000)**, **zero of them selling in calm waters** – so tier one is intact and the tail is
  a third of what you accepted. ⭐ Units also make the multi-entry case *safer* than the rebase did:
  the old model pulled the WHOLE holding onto the newest clock, so a top-up in season nine turned a
  season-one holding into a one-year hold; now only the new money is on the new clock.

  ⚠⚠ **ONE THING IS STILL YOURS, and it is the «+65» end of what you saw.** The −15 end is inside the
  new distribution (p5 is −16.8%). The +65 is not: the best season in 228,000 is **+69.2%** and
  **0.56%** of seasons clear +50% (was 1.51%). Those seasons are **crash REBOUNDS, not the wave**, so
  the knob I moved cannot delete them – a 40-week recovery out of a −30% hole is +53% before the wave
  adds anything. Removing them means changing a number **you** gave the day before: either
  `CRASH_DEPTH_RANGE` shallower than «-15…-30%» (a −20% floor puts the best rebound near +40%, about a
  real index's best year), or a slower `CRASH_RECOVERY_WEEKS` so no single season holds a whole
  rebound (bounded at `[60, 88]`, or crises overlap and the safety proof dies). **Say which and it is
  one constant.** I did not shave your crash band on my own.

  ⚠ **Schema: v66 AMENDED, not a new v67** – main is at 65, so no v66 save exists outside this wave
  and the append-only rule has not bitten yet (the same ground the P1 yacht rename used, in the same
  step). A save from your device converts **at the price of its own basis week**, so the holding is
  worth the same cents it was worth this morning and the entry price is recovered rather than reset.

  ⚠ Frozen MAIN capture (41550 / `e6b0c709`) **unmoved**, and derived rather than inherited: per-key
  hashes of all three frozen careers are byte-identical against a control tree with this change
  reverted, and a 239,713-draw MAIN capture matches on both trees. ⚠ Every round 29 top-up and
  part-sale guard is **re-aimed with a note, none deleted**; both of round 29's own latent flakes were
  re-checked and one of them turned out to guard something smaller than it looked (written down at its
  line). ⭐ And a dead guard was caught in this item's own draft – a per-row idempotence check in the
  migration that could not be false – and deleted.

- [ ] **15. «Для машин вполне можно ввести годовую стоимость обслуживания, которая может с каждым годом
  немного расти, как в реальности, пока стоимость авто на рынке падает»** – **build.**

- [ ] **16. CI: the build is 18m32s and the shape is measured.** `npm test` is **15m08s of it** –
  `bulk` 501 s then **eleven heavy files strictly serially, 406 s**, so for 406 s of every run half the
  runner is idle by construction (`scripts/units.mjs` loops `spawnSync`). `npm ci` is **6 s**, so extra
  jobs are nearly free. ⭐ Three jobs – bulk · the heavy shards · component+types+build+static – put the
  wall at **~9-10 min**; splitting `bulk` itself with vitest's `--shard` reaches ~7-8. ⚠ Parallelising
  the heavy files INSIDE one job is the one thing not to do: separate processes exist because of
  birpc's stalls under contention.


- [x] **17. ⚙ «на турнирных неделях с пресс-конференциями всё-таки давай сделаем как в реальности:
  матч, конференция через 30 минут, потом массаж»** – **RULING, and it restores the agent's own first
  instinct over my correction.**

  ⚠ The builder wrote `draw → press → massage` first, reasoning that a real press conference follows
  within the half-hour. **I made him swap it** to `draw → massage → press` on a literal reading of the
  owner's earlier enumeration «после матчей, массажа и конференций» – which was a LIST, not an order.
  He has now said the order outright and it is the builder's original. ⭐ Worth keeping as a lesson:
  a list of things is not a sequence of them, and I turned one into the other.

  **Order on every match day of every rung: draw block → press → massage.**

  ⚠ **The 30 minutes cannot be drawn literally and that is a grid fact, not a shortcut**: `DayBlock`
  is `{ start, span }` in WHOLE HOURS (`span: number` – «length in hours, >= 1»), and the grid's rows
  run 07:00–19:00. So «через 30 минут» renders as **the next hour block after the match**, which is
  the same thing the eye reads. **Do not add half-hour support for this** – it would re-shape every
  day in the game for one gap; if the half-hour ever matters, it is its own decision.

  **SHIPPED.** `tripMatchDay` (`weekGrid.ts`) pushes the press hour before the table, so every match
  day of every rung reads **Draw day → Press → Body work**. Two `if` lines swapped; nothing else in
  the arc moved, because the two blocks are one hour each.

  ⚠ **The Slam's Sunday still fits, and it was measured rather than assumed.** `Draw 10–14 ·
  Press 14–15 · Body work 15–16 · Travel home 16–19` – four blocks ending exactly on the grid's last
  row, the same arithmetic as before the swap. Nothing was shortened; the two arms that would have
  caught a compression (`the flight starts at 16`, `no block's span changed between the Sunday and
  the Monday`) are green as they stand.

  ⚠ **The order pins were re-aimed, never deleted, and re-measured.** Two of them assert the
  sequence – the Slam-Sunday four-label arm and P14's «it follows the match» arm – and both carry a
  ⚠ note naming this ruling and the misreading it undoes. The mutation log entry M17 was rewritten
  and re-run in its new direction: swapping back to `draw → table → press` reddens both, 2 red.

  ⭐ **The lesson is in the code too**, at `tripMatchDay`: a list of three things is not a sequence
  of them, and the correction that turned «после матчей, массажа и конференций» into an order is
  what built the wrong day. The builder's first instinct was right and is restored.
