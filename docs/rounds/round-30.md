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

- [x] **5. «Внутри Bills и Shop сделать дополнительные вкладки как на экране Spending (12 weeks/So far)
  для каждой категории.** Для Bills – Her Kit / Advs Portfolio. Для Shop – сверху плашкой **The shelf**,
  ниже в ряд **Invest / Cars / Property / Business (Academy is subdivision inside) / Water / Air**.
  Для каждой карточки свой арт, карточки лежат **без общей подложки**, примерно как на экране Season» –
  **build.** ⚠ Art is his; use the documented fallback.

  **SHIPPED, and the tab names are his, spelled as he spelled them.** `MoneyScreen.vue`:

  * **Bills** gets `Her Kit` / `Advs Portfolio` – the Spending chapter's own switcher (`SegmentedRow`
    on the plate, not the chapter picker's larger `chapter` appearance), sitting under the budget
    levers.
  * **Shop** keeps `The shelf` as the плашка at the head of the chapter and gains the six-segment row
    under it: `Invest / Cars / Property / Business / Water / Air`. ⚠⚠ **The academy is a SUBDIVISION
    of Business and not a seventh tab** – `SHELF_TAB_FAMILIES` maps that one segment onto two
    families, so the brand and the four stages share a page under their own unchanged headings.
  * **The rungs are cards laid straight on the page** – `Card variant="photo"` in a
    `.shelf-feed` column with a 12px gap, which is `.event-cards` on Season. The single card that
    used to hold the whole catalogue is gone, and with it the plate-behind-a-plate.
  * **Art**: `src/art/shelf.ts`, `vacationArtUrl`'s documented contract verbatim – one key per card,
    `null` until his painting lands, and a card with no painting simply has no band. The map is EMPTY
    today, so nothing draws a picture yet and nothing draws a broken box either. Taking delivery of a
    painting is one line in that map.

  ⚠ **WHAT I DID NOT FILE UNDER HIS TWO BILLS NAMES, and it is a question for him.** The chapter has
  four blocks; he named two. The **budget levers** (the physio retainer) and **Her academy** (the
  scholarship) are neither kit nor advertising, so they stay OUTSIDE the switcher – above and below
  it, in the order they already had. Filing a physio bill under `Her Kit` would be this screen making
  a classification he did not make. **Say the word and either one moves under a tab.**

  ⚠ **A duplicated heading is visible and was left alone, deliberately.** The `Cars` and `Property`
  segments open onto family headings that read `Cars` and `Property` – the same word twice. Renaming
  or deleting the heading to tidy it is exactly the unasked wording change item 4 was about, so it
  stands. **One sentence from him and it goes.**

  ⭐ **The empty `Advs Portfolio` says something now.** The engine hands an empty shelf below
  eighteen, which used to mean one missing card among four and would now mean a blank tab. The note
  reads the age out of `ECONOMY.advertising.fromAgeYears`, so it cannot drift from the gate.

  ⭐ **375px: measured in a real browser, and it needed a fix.** Six pills at the shared metrics is
  about 450px of control inside the 343px a 375px phone has. `.money-subtabs` tightens the shelf's
  pills and lets the row wrap rather than overflow; `e2e/responsive.spec.ts` now opens both chapters
  and asserts no sideways scroll AND that his six are one row. Mutated separately: tightening alone
  is green, wrap alone is green, **neither is red**.

  ⭐ **Seven mounted files were RE-AIMED, none deleted** – `tests/component/shelf.ts` is the helper
  that presses the tab a player presses, and every claim those files made is the claim they still
  make. New guards in `round30-subtabs.test.ts` / `round30-shelf-art.test.ts`, eleven mutations run
  one at a time (the tab renamed, the academy promoted to its own segment, a family dropped from the
  map, a family mapped onto two segments, the shared plate restored, a heading tidied to match its
  tab, the art keyed by family instead of by row id, the age hand-typed, the row given the chapter
  appearance, the Bills segments stopped hiding each other, and the art map filled).

- [x] **6. «Переделать экран при нажатии на плашку Next tournament на Home** – убрать рамку, картинку
  турнира квадратной (по примеру главной), часть описания на картинке, часть ниже… The read можно на
  картинке, раунды отдельной плашкой ниже на всю ширину с отступами, погоду и поездку тоже на картинку,
  4 иконки под картинкой просто в ряд без плашки, план тренировок внизу остаётся как есть» – **build.**
  ⚠ Round 29 part-two #8 built this panel by reusing the tournament splash; this is its redesign.

  **SHIPPED, and it is a REDESIGN and not a rebuild – the proof is that round 29's own mounted test
  passed across it unchanged.** `NextTournamentPanel.vue` + one line on `ThisWeekScreen.vue`:

  * **No frame, twice.** The hosting `<section>` is `.bare` – src/style.css's own idiom, the one the
    Season screen uses so that «the cards themselves are the only objects on the page» – and the hero
    stopped being a `<Card>`, so its hairline went with it. ⚠ Only while the panel is there: a week
    with nothing entered keeps the frame it had, because he did not ask about that state.
  * **Square**, `aspect-ratio: 1 / 1`, which is the declaration Home's own hero carries. ⚠ It is a
    FLOOR and not a clamp – the box is a flex column, so a three-line read plus a coach's caution
    pushes it taller instead of clipping an engine-authored sentence.
  * **On the picture**: the name, the court and the dates; `The read` with its ring; and the weather
    and the trip, all three readings with all three labels.
  * **Under it**: the four icons in a row with nothing behind them, then the rounds as the ONE plate
    on the panel, full width inside the app's 16px gutter.
  * **The training plan is untouched**, frame included – it is ThisWeekScreen's own second section.

  ⚠⚠ **NOT ONE FIGURE, SENTENCE OR LABEL CHANGED** (invariant 4). `tests/component/round29-next-tournament.test.ts`
  – thirteen assertions about what this panel says – is green with no edit at all, which is the
  evidence that only the seating moved. The new placement guards are
  `round30-next-tournament-layout.test.ts`, six mutations run one at a time (square → 16/9, the hero
  back to a Card, the read moved off the art, the money moved off the art, a plate behind the four
  icons, the section frame kept), plus two in a real browser at 375px (the square, and the four icons
  staying one row).

  ⭐ **375px verdict: it fits.** `e2e/responsive.spec.ts` enters a tournament through the two controls
  a player uses, opens Home's own Next-tournament card, and measures – no sideways scroll, the hero
  at or above square inside 375px, the four icons on one row with none of them off the edge.

  ⚠ **One thing I did NOT do, and it is his to call.** Home's hero is square AND full-bleed (it
  cancels the app gutter). This picture is square inside the gutter, because he asked for the rounds
  plate to be «на всю ширину с отступами по краям» and a full-bleed picture beside an inset plate is
  a composition he did not describe. **Edge-to-edge is a one-line change if he wants it.**

- [x] **7. «Что-то не так с попапом "теперь каждый год начиная с 29 лет" – звучит как механический
  приговор безысходности пока что, надо что-то с этим сделать»** – **build (copy).** ⭐ The mechanic is
  the retirement corridor and it is correct; what is wrong is that it reads as a sentence passed rather
  than a fact about age.

  **SHIPPED, and the kinder version turned out to be the more ACCURATE one, which is why it is one
  line and not a softening.** The old lede announced a schedule – «The off-season question, the way it
  gets asked from twenty-nine onward» – and a rule read out at a person is a verdict. It was also not
  the whole truth. `docs/specs/the-long-goodbye-2026-08.md` §3a: the last offer arrives when her
  physical falls below **55% of HER OWN PEAK** (your ruling of 26.08), which is age **~41.2 on a body
  kept well** and earlier on one that never got there, and every year of it is bought with physio,
  load and luck. §4a's recovery corridor fades continuously from 29 rather than stopping. So «every
  year from 29» describes when the asking STARTS and says nothing about when it ends.

  ```
  Is there another year in this?                                     <- unchanged
  Twenty-nine is when the question starts being asked, not a
  countdown to anything. There is no wrong answer, and she can
  say no for as many winters as her body gives her.
  ```

  ⚠ **ONE STRING MOVED.** The heading, the kicker, both controls, the final card and the plateau card
  are untouched – invariant 4, and item 7 asked for one popup. ⚠ **No engine number is spelled out**:
  «41» is a constant seen through a curve, and a prose figure that cannot move with its constant is
  the R2-02 hazard pointing the other way. «As many winters as her body gives her» stays true at any
  share you ever set it to. ⚠ The byte-identity pin in `tests/component/last-word.test.ts` is
  **re-aimed with a note, not widened** – its own header predicted this wave in as many words («if a
  future wave genuinely re-words the offers she can still answer, this test is supposed to go red and
  be re-aimed deliberately»).

- [x] **8. «Merch brand давай предложим пользователю несколько вариантов именования при покупке…
  один из вариантов "ввести своё название" – это придаст +100 к индивидуальности сразу. Среди вариантов
  по дефолту могут быть инициалы ребёнка или что-то связанное с именем или фамилией»** – **build.**

  **SHIPPED, with #10.** For a girl called Vera Martin the brand row offers `VM` · `Martin` ·
  `Vera Martin` · `House of Martin` as chips, and a free-text field under them. ⭐ **Not one suggestion
  is generic** – every option carries her first name, her surname or her initials, so the list is
  about YOUR daughter and could not be the list any other career sees. That is «+100 к
  индивидуальности» made mechanical rather than promised, and a test asserts it over the whole list.

  ⚠ **The chips WRITE INTO the field rather than sitting beside it**, so there is one value on screen
  and «I picked a chip but there was text in the box» is not a state the control can be in. The field
  starts on the first suggestion, so a player who never touches it still buys a brand with her name on
  it.

  ⚠⚠ **THE FOUR RULES FOR TEXT YOU TYPE, decided and stated** (it is persisted, it is rendered, and it
  is the only free text in a save besides her name – `sanitiseAssetName`):

  | | rule |
  | --- | --- |
  | **length** | **24 code points**, and code points rather than `.slice` – slicing can cut a surrogate pair in half. The field's `maxlength` is the same constant, so the cap is felt while typing. |
  | **characters** | an **allow-list**: Unicode letters and digits, the space, and `& . ' -` – every character real brands use (`Ben & Jerry's`, `S by Serena`, `TB-12`). Control characters, bidi overrides and zero-width joiners are refused by not being on it. ⚠ **Cyrillic is allowed** – the house rule against it is about OUR copy in a template; a name you type in your own alphabet is data. |
  | **empty** | becomes the **first suggestion**, never a refusal. Blank, spaces-only, or nothing but disallowed characters all land on a name built from hers. «мы ни за что не наказываем» applies to a text field too. |
  | **375px** | **measured, not assumed**: a 24-character unbroken name is mounted at 375x667 and its line is checked against the card's own content box, with `overflow-wrap: anywhere` as the belt. Deleting that one CSS rule reddens the arm, alone. |

  ⚠ **Bounded twice.** `buyAsset` sanitises what the game stores; `assetNameOf` sanitises AGAIN on
  every read, because a save file is not a command and `saveGuard`'s 32,768-character ceiling is four
  hundred times too loose to protect a layout.

  ⚠⚠ **SCHEMA: v66 AMENDED, not a new v67** – main is at 65, so no v66 save exists outside this wave
  and the append-only rule has not bitten (the same ground #14 and P1 used, in the same step). The
  step **back-fills a name** onto any brand or academy a save already owns, from the game's own first
  suggestion – so your current save comes back with the brand already called something rather than
  nameless forever. ⭐ That is deliberately the opposite of the same step's refusal to back-fill
  LEDGER rows: a ledger must stay truthful about what it charged, and a name is not a record of an
  event.

  ⚠ **One thing I did NOT touch and it is yours**: the weekly income row in the ledger still reads
  `Merch – her name on the shelves`. Putting the brand's own name in it would be a wording change you
  did not ask for (invariant 4). **Say the word and it is one line.**

- [x] **9. «сам Merch brand тоже вполне может расти в цене как бизнес по какой-то логике, похожей на
  привязку к её рекламе и результатам. Можно провести анализ доходов и стоимости бренда RF (Roger
  Federer) для референса»** – **research, then build.** The brand becomes an asset with a VALUE, not
  only an income line.

  **RESEARCHED FIRST, and the first answer is a GAP you should know about.**
  `docs/research/player-brands-and-what-they-are-worth.md`, sourced and tagged throughout.
  ⚠⚠ **THE RF MARK HAS NO PUBLISHED VALUE AND CANNOT HAVE ONE.** It sits in **Tenro AG**, Federer's
  private Swiss holding company; On Holding's IPO prospectus and its FY2025 annual report both name
  Tenro **only in a risk factor** and never in the financials, so not even the royalty is public. The
  two figures in circulation ($27M, and a rule-of-thumb $6.75M) are a solicitor's aside and an
  illustration. ⭐ And one fact that should stop any model priced off a mark: **for two years
  (2018–2020) he had lost legal control of his own logo, and 2020 was the best earning year of his
  life** ($106.3M, top of the Forbes list). The mark was not where the value lived.

  ⭐⭐ **THE THREE FINDINGS THE MECHANIC IS BUILT ON:**
  1. **Brand value follows the ACCUMULATED stock, never current form.** Sugarpova expanded THROUGH a
     fifteen-month doping ban. Federer's off-court income went **$90M → $95M in the year he retired**,
     and he was the highest-paid tennis player in the world for a 17th straight year having not played
     for fourteen months. Jordan Brand did ~$8.7bn twenty-one years after he last played. ⭐ Which
     means the game's existing fame stock was already the right fuel.
  2. **⭐⭐⭐ IT FALLS, and this is the citation for it.** Federer's On stake ran ~$603M in January 2025
     and ~$289M in August 2026 – **down about half, some $300M, while he was retired and nothing
     whatsoever about him changed.** A shoe company missed a quarter.
  3. **A brand that stops earning is still worth the MARK.** Björn Borg's own company went bankrupt in
     1990; the NAME was bought outright for **$18M in 2006** and is a listed company doing SEK 1,044M
     today. (And the failure mode of a name-attached brand is not a crash but **starvation** –
     Sugarpova, S by Serena, EleVen and TB12 all died quietly within ~18 months of the athlete's last
     season, with no announcement and no sale price.)

  **BUILT.** `docs/specs/the-shop-2026-08.md` §16 is the record; the mechanic in one line:

  ```
  worth = max( what they paid x 0.25 ,  fame x $30/wk x 52 x 16 )
          └── the mark ──────────────┘  └── years of what it earns ─┘
  ```

  ⭐⭐ **SAME FUEL AS THE INCOME, WHICH IS YOUR OWN «похожей на привязку к её рекламе и результатам»**:
  a title, a lost Slam final, a top-10 season and a photo shoot each move the value AND the weekly
  cheque, through one number, and nothing else on the career can move either.

  ⚙ **THE MULTIPLE IS MEASURED, BECAUSE THE SOURCES GIVE A BAND AND NOT A NUMBER.** No player-brand
  transaction publishes both an earnings figure and a price; the nearest two are Beckham's DRJB at
  ~10.9x profit and the Nadal academy at ~31x. So the criterion is the game's: **the brand should be
  worth about what it cost on the day a family can actually afford it** – a rung whose whole pitch is
  «дешевле академии» must not read as a paper loss the week it is bought. Measured over **108 careers
  x 780 weeks** (`tools/merch-fame-vs-rank.ts`):

  | | measured |
  | --- | ---: |
  | careers that could ever carry the $250,000 | **100 of 108**, median first week 306 |
  | fame the week they could – p10 / median / p90 | 5.4 / **9.6** / 18.7 |
  | the brand's worth that day at **16x** | $134,374 / **$240,852** / $466,149 |
  | at or above what it cost on day one | **46 of 100** – a coin flip |
  | at the career's PEAK fame | median **$1,447,283 = 5.8x the price** |
  | **seasons in which the VALUE FELL** | **28.7%**, median −19.7%, worst −29.3% |

  ⭐ **The median family is 96.3% of the way to square on the day it buys**, which is what 16x was
  chosen for. ⭐⭐ **And roughly one season in three takes value off it** – the same order as the index
  fund's «one year in four», which is the property this item was required to have: a risk asset, not
  a savings account with a picture on it.

  ⚠ **No schema move for the value** – `valueCents` is already persisted and already rewritten every
  tick, so a save that owns a brand is re-priced on its next tick with no migration. ⚠ Frozen MAIN
  capture (41550 / `e6b0c709`) **unmoved and DERIVED**: per-key hashes of three frozen careers are
  byte-identical against a control tree with this wave reverted, and a **1,869,811-draw** MAIN capture
  over three careers x 780 weeks matches on both trees.

  ⚠ **The ACADEMY is still valued at what was paid for it** and I did not change that on my own – you
  named the brand. It is the same one field if you want it (`earningsMultipleX` on the four stages,
  priced off reputation instead of fame), and the research says an academy is the case that survives
  a career best. **Your call.**

- [x] **10. «И нейминг для академии тоже по принципу бренда, как раз одним из вариантов можно
  предложить уже существующее название бренда (если он есть) или снова "ввести своё"»** – **build**,
  with 8.

  **SHIPPED, and your first option is literally first.** The academy's chips read
  `<the brand's own name>` · `Martin Academy` · `Vera Martin Academy` · `VM Academy`, and the brand's
  name is only there when they built one – with no brand the list is the three name-derived ones and
  nothing is missing. Same free-text field, same four rules.

  ⚠⚠ **THE NAME BELONGS TO THE FAMILY OF RUNGS AND NOT TO THE ROW, and that is what makes the academy
  work at all**: it is FOUR purchases and ONE institution. The name is written on the first rung of
  its family the household buys – the land – and every later stage READS it, so «Harefield Academy»
  cannot become four differently-named buildings. A later stage carrying a name in a stale tab is
  refused engine-side, not just hidden.

  ⚠ Duplicates are collapsed: a family that called its brand «Martin Academy» does not see that chip
  twice.

- [x] **11. «И как будто бы Holds its value странно звучит тоже – это напрямую значит, что оно
  обесценивается, а это вроде бы не совсем так»** – **build (copy).** ⚠ Check what the engine actually
  does to that asset before rewording – if it really does hold value, the words are wrong; if it
  depreciates, the words are right and the DESIGN is the surprise.

  ⭐⭐ **CHECKED FIRST, AND YOU ARE RIGHT: IT REALLY DOES NOT DEPRECIATE, so the words were the only
  thing suggesting it might.** A rung at `annualRateBps: 0` is worth `paid x 1^n` – **exactly what was
  paid, every week, forever** – and `sellAsset` hands back the stored value **whole**: no spread, no
  fee, no haircut. There is **no inflation anywhere in this engine** either, so there is not even a
  real-terms slide hiding behind the nominal figure. Pinned on a ticked world at 1, 5 and 15 seasons
  and then on a real sale four seasons later, to the cent.

  **The line is now «Neither gains nor loses».** It is the ZERO of the sentence its two siblings say
  («Loses 6% a season», «Gains about 7% a season»), so it reads as a rate rather than as a slow slide.

  ⭐⭐⭐ **AND THE ROW YOU WERE MOST LIKELY READING IT ON IS GONE FROM THAT BRANCH ENTIRELY – by item 9,
  which is your own next sentence.** The merch brand is priced as a business now, so its line says
  «Worth 16 years of what it sells». What still says «Neither gains nor loses» is the four academy
  stages and nothing else.

  ⚠ **ONE STRING MOVED** and nothing else on the shelf did: the car's «Loses 9% a season» and the
  fund's «Gains about 7% a season» are asserted unchanged, to the byte, in the same test.

- [~] **12. «На 30 лет снова "один день вместе" =) давно не было, но я ещё понаблюдаю»** – ⚙ **his own
  hold.** Round 27 #7 shipped a one-birthday cooldown on the VOICE (longest run 4 → 1, share 30% → 24%);
  a recurrence at a 30-year gap is inside that. He is watching. Nothing to build.

- [x] **13. «Почему-то merch brand приносил 600+, а через несколько месяцев стал 500+, хотя позиция в
  таблице уже 15»** – **measure.** ⚠ Merch income follows FAME, and fame DECAYS (halves over 104 weeks
  by design). A rising rank with a falling fame stock is possible and may be correct – but it may also
  be the decay outrunning what play can add. Measure before touching.

  ⚙⚙ **MEASURED, AND THE ANSWER IS: THE MECHANIC IS WORKING. Nothing was changed.**
  `tools/merch-fame-vs-rank.ts`, 108 careers x 780 weeks, every window that has a professional
  standing at both ends and a brand that is earning – **64,253 of them at your own «несколько
  месяцев»**.

  ⭐⭐⭐ **YOUR EXACT WEEK IS IN THE OUTPUT, reproduced rather than modelled:**

  ```
  bench-working-0 w363:  WTA #20 -> #16,  $781/wk -> $656/wk over 26 weeks,
                         0 fame-earning events in the window
  ```

  **1,475 such weeks** across the run (WTA #10–20, brand paying $400–800, income down over half a
  year). So the game really does produce what you saw, often.

  | window | rank BETTER + income DOWN | share of CLIMBING windows | the fall | of which NO fame-earning event |
  | ---: | ---: | ---: | ---: | ---: |
  | **13 weeks** – your span | 14,400 | **42.0%** | median **−8.3%** | **96.9%** |
  | 26 weeks | 9,857 | 27.2% | median −15.9% | 80.7% |
  | 52 weeks | 5,587 | **15.1%** | median −15.7% | 43.7% |

  ⭐⭐ **THE STRONGEST EVIDENCE THAT IT IS THE DESIGNED DECAY AND NOTHING ELSE: the fall is the decay
  curve to two decimals.** 0.5^(13/104) = **−8.30%** against a measured −8.3%; 0.5^(26/104) =
  **−15.91%** against −15.9%. That is the 104-week half-life doing exactly what
  `docs/specs/fame-and-the-shoots-2026-08.md` §3 built it to do – «a rolling memory, not a trophy» –
  and in **96.9%** of those quarters the career produced no title, no lost Slam final, no top-10
  season wrap and no shoot week at all. **There was nothing for the decay to outrun.**

  ⭐ **And over a SEASON a climbing career's brand is up far more often than down**: 52.2% up against
  9.3% down. What you caught is the shape at a quarter's remove, which is the resolution the shop row
  is read at.

  ⚙⚙ **SO THE VERDICT, PLAINLY: this is the mechanic working, and I would not change the half-life.**
  Rank is a 52-week rolling window over POINTS; fame is a decaying fold over TITLES. They are two
  instruments measuring two different things, which is what P7 built them to be – «мерч… НЕ ranking»
  was the design, and the census behind it is that off-court money is not ordered by ranking.
  The research for item 9 says the same thing from the outside: Sugarpova **grew through a doping
  ban**, Federer earned $90M in a year he played fourteen months of nothing. Brand money follows the
  stock, not the table.

  ⚠⚠ **BUT ONE THING IN IT IS YOURS TO RULE ON, and I am not going to fix it unasked.** The fame FLOOR
  counts titles, lost Slam finals, top-10 seasons and lived shoot weeks – **and nothing else**. Your
  own order for merch was «растущий от частоты и обилия рекламных контрактов, съемок, **выступлений**,
  титулов и прочего», and «выступлений» is the one word the floor does not read. A player climbing
  #40 → #15 does it on quarter-finals and semi-finals at big events, and **none of that reaches the
  brand**, which is why 42% of climbing quarters look like the one you saw. If you want a deep run to
  register, it is a small addition to `ECONOMY.fame.titleFloor` – say, a Slam or 1000 semi-final worth
  a fraction of the title – and it needs a re-bench because it moves the merch income everywhere.
  **One sentence from you and it is a day.**

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

- [x] **15. «Для машин вполне можно ввести годовую стоимость обслуживания, которая может с каждым годом
  немного расти, как в реальности, пока стоимость авто на рынке падает»** – **build.**

  **SHIPPED.** `docs/specs/the-shop-2026-08.md` §15 is the record. ⭐⭐ **Two curves, both off fields
  the shelf already had**: `annualRateBps` (on every car since slice 1, negative by design) takes the
  market value DOWN, and a new `upkeepGrowthBps` takes the weekly bill UP. The item is that
  `assetUpkeepCents` now has an AGE to read them against.

  | rung | price | loses / yr | **upkeep / yr** | **/ week, year 1** |
  | --- | ---: | ---: | ---: | ---: |
  | the sensible estate | $60,000 | 6% | **5.0%** | **$57.69** |
  | the good saloon | $110,000 | 9% | **5.5%** | **$116.35** |
  | the one from the poster | $190,000 | 12% | **7.0%** | **$255.77** |
  | the unreasonable one | $300,000 | 15% | **9.0%** | **$519.23** – about an elite coach |

  ...and **6% a year on top of it, capped at double** (reached in the twelfth season of ownership).
  ⚠ The rates are a real-world ladder, not a multiple of the price: servicing, insurance, tyres and
  tax on an ordinary estate run about a twentieth of what it cost, and the same list on a two-seater
  with carbon brakes runs nearly twice that SHARE. **Fuel is excluded on purpose** – nothing in this
  game knows how far anybody drove, and a cost nobody can influence should not be modelled as if they
  could.

  ⚙ **MEASURED, and the crossover is the finding:**

  | rung | 10 yrs of upkeep | 10 yrs of lost value | **the year keeping overtakes losing** |
  | --- | ---: | ---: | ---: |
  | the sensible estate | **$40,694** | $27,683 | **4** |
  | the good saloon | **$82,067** | $67,164 | **8** |
  | the one from the poster | **$180,412** | $137,085 | **7** |
  | the unreasonable one | **$366,249** | $240,938 | **6** |

  ⭐ **Keep a car long enough and the KEEPING costs more than the LOSING** – which is exactly what
  happens to a real car, and it is now the two curves you described crossing on one row.

  **And the early economy barely moves, A/B on one tree** (arm A = this same commit with the four
  cars' two upkeep fields stripped, so the reader is present in both arms and only the data moves):
  careers buying before season 4 **17 of 54 in both**; season-slots where the shop was the largest
  outgoing **17 → 19 of 216**; worst shop share of a season **82.3% → 84.1%**; the funds ladder
  byte-identical, as it must be – a bill only reaches a family that owns one.

  ⚠⚠ **THE BOATS AND THE PLANES DID NOT MOVE ONE CENT, and that is a scope decision I want you to
  see.** You said «для машин». The elite rungs carry no growth at all, so their bills are byte-
  identical at any age – and the reason is that §3f's «nothing here can strand a family» was MEASURED
  at the flat figure ($23,076.92 a week at 10% of a $12M yacht). Compounding a bill whose safety
  property was proved flat is a balance change to a shipped rung. **If you want the yacht's crew to
  get dearer too, it is one field on four rungs and a re-bench.**

  ⚠ **Nothing can strand a family**, on §3f's own test and checked on a ticked world rather than
  inherited: a car has NO build wait, so it is sellable the week it is bought and every week after.
  ⚠ The card and the till still quote ONE number – an owned row now says what the ledger is charging
  TODAY, which is how the old «the figure you were quoted, forever» promise is kept once the figure
  moves. ⚠ Two round-29 guards **re-aimed with notes, neither deleted**, and one of them was a guard
  that could never have been false again once a car bills weekly.

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
