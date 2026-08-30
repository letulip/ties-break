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

- [x] **16. CI: the build is 18m32s and the shape is measured.** `npm test` is **15m08s of it** –
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


- [x] **18. ⚙ «в край, как hero картинка на главной, если можно. И плашки дальше как на главной на
  своих подложках, **кроме этих 4х характеристик турнира** про призовые, зрителей и т.п.»** –
  **RULING on the Next-tournament screen, settling the one thing its builder left open.**

  He asked for the rounds plate «full width with side padding», and the builder correctly refused to
  guess whether the picture should then run edge to edge beside it. It should:

  - the tournament image goes **full-bleed, exactly like Home's hero**;
  - the plates below sit **on their own backings, as on Home**;
  - ⚠ **except the four tournament facts** (prize money, crowd and the rest) – those stay a bare row
    with no plate, which is what round 30 #6 already asked for and shipped.

  ⭐ So the screen ends up Home's own composition: a full-bleed hero, a bare row of four under it,
  and everything after that on plates.

  **SHIPPED, and it is one declaration.** `.nt-hero` now carries
  `margin: 0 calc(-1 * var(--app-pad-x))` – the same gutter cancellation `.diary-hero` uses on Home
  and `.kid-hero` on the kid page, by the same token rather than a guessed `-16px` (the sheet records
  what happened the one time that number was guessed: an 8px band of page colour above Home's
  photograph). Two details came with it and both are geometry: the 17px radius goes, because a
  rounded corner against the phone's own edge leaves a wedge of page colour in each one – the frame
  he asked to lose, in miniature – and the on-art padding becomes the gutter token, so the title,
  `The read` and the three readings line up with the icon row and the plate below them.

  ⚠ **Only the horizontal half of Home's rule.** `.diary-hero` and `.kid-hero` eat `--app-pad-top`
  as well, because each is the first thing on its screen; this one has a heading and the week's
  status line above it, and eating the top inset would pull the photograph up into them.

  ⚠ **The other two clauses needed no code and are now pinned anyway.** The rounds plate was already
  a `<Card>` inside the gutter and the four facts were already bare – so what this wave adds for them
  is the guard that says so: the plate's backing and its gutter are read through the real cascade,
  and the facts row is asserted to have neither fill, nor tone, nor hairline, nor a card anywhere
  above it.

  **Nothing else moved: `round29-next-tournament.test.ts`'s thirteen assertions pass UNEDITED**, the
  same evidence #6 produced. Five new mounted assertions and two new browser ones, all
  mutation-verified – nine mutations, each reddening exactly its own claim (margin removed, token
  replaced by a literal, Home's shorthand copied whole so the top inset is eaten, Home's
  `max-height` clamp copied across, a plate grown behind the four facts, the rounds plate unpainted,
  and the rounds plate given the hero's own full bleed).

  ⚠ **The square is still a FLOOR, not a clamp** (#6's decision, and the full width makes it matter
  more: on a 375px phone the box is now 375px tall rather than 343). Home's own hero clamps at
  `max-height: 60vh`; copying that across with the margin is one of the nine mutations, and it goes
  red.

  ⭐ **375px verdict: green, and the page does not scroll sideways.** `e2e/responsive.spec.ts` was
  extended rather than replaced – its «inside the phone» arm still guards the overflow direction,
  and the two new arms measure the hero starting at 0 and finishing at 375 while the plate under it
  keeps 16px on both sides.


---

## Part two – played to week 896 (30.08)

Save `alice-cfbv_w896` (⚠ personal, `~/Downloads`, READ-ONLY, never a fixture): schema 66, **WTA #23**,
owning `index-fund · car-sensible · house-first · merch-brand · deposit · academy-land`.

- [x] **19. «Аватар иконка в левом верхнем углу home экрана для milf стадии показывает только нижнюю
  часть лица без глаз и волос»** – **REPRODUCED AND FIXED, and it was one line of a table.**

  `src/art/faceRects.ts` held `'milf-norm': [257, 150, 145]`. That opens the crop window at y 77 of a
  512px painting whose face centre is at **y ≈ 85**, so the shipped 256px avatar really was a chin, a
  neck and a necklace – exactly what you saw. It is the **default** emotion of the 31+ band, which is
  why it is on your screen every week and why nobody caught it before: every other band's `norm` is
  correct, so nothing looked wrong until a career got past thirty.

  New rectangle `[240, 85, 165]`, and it is **not eyeballed against the neighbours** – it obeys the
  file's own framing rule (centre on the face; side = 1.5× the head height, here ~110px), landing
  inside the set's measured 124–182 spread. The crop was re-cut through the pipeline's own two steps
  (the cutter's extract/resize, then `optimize-art`'s quality ladder) so its byte profile matches the
  other thirty-four.

  ⭐ **AND THE SAME LINE STEERS THE HERO.** `facePoint` reads columns 0–1 of this table for
  `object-position`, so the one edit fixed both the icon you reported and every non-square window
  that frames that painting – the fork card, the retirement card and the tournament finale.

- [x] **20. «Картинка hero для milf стадии lateCareer-norm, проверь все. Может быть кто-то из агентов
  был прав и имеет смысл их переименовать со сленга на lateCareer или grown, давай сделаем разом»** –
  **BOTH HALVES DONE.**

  **«ПРОВЕРЬ ВСЕ» – all forty rectangles were checked, not just the reported one.** Every entry was
  drawn back over its own painting as a contact sheet (5 stages × 8 faces) and looked at. **#19 was
  the only miss.** ⚠ `lateCareer-angry` reads low in a thumbnail and is **correct** – her head is
  tilted down in that painting; it was cut and looked at rather than adjusted on the strength of a
  thumbnail. The Home hero itself frames every painting whole (`.diary-hero` is square and the
  paintings are 512×512, so `object-fit: cover` has no overflow to slide) – the face centre only
  bites on the non-square cards, which is where #19's bad centre was also showing.

  ⚙ **THE RENAME – and half of it had already happened.** The TYPE has been `lateCareer` since
  R2-18/PROD-13, which moved the band name off the slang word and **deliberately left the files**:
  «an atomic rename of ~20 assets plus the recovered-rectangle table is a different change with a
  different risk». Your ruling takes that deferred half: **seventeen files renamed** (six crops under
  `public/avatars/`, ten paintings under `public/images/fem-euro-brunnet/`, plus the one re-cut),
  every key of the crop table, the alias now identity on all five bands, and the lore bible's live
  instruction lines. `lateCareer` over `grown` because it makes the **stem equal the stage**, which
  retires the entire class of bug the alias exists to prevent.

  ⚠ **NOT A SCHEMA QUESTION – checked before assuming, as asked.** A stage is DERIVED from her age at
  snapshot time (`portraitStage`). `MemoryCard.stage` and the narrative cards are Snapshot types;
  `WorldState` holds no stage and no portrait URL; there is no `'milf'` literal anywhere under
  `src/engine` or `src/db`. **No save records a band**, so `SAVE_SCHEMA_VERSION` stays at 66 and no
  migration is owed.

  ⚠ **The mapping is pinned and the pin was proved.** `tests/portrait-bands.test.ts` sweeps every band
  × emotion against the files on disk; renaming one file back turns two arms red naming the missing
  stem. That is what stops a half-done rename showing a player an empty frame at thirty-one.

- [x] **21. ⚠⚠ «Почему-то мне пишут "Her cut 61% – $69,750 into her own account", и до этого было про
  56%… При том, что на экране бюджета написано "She keeps 50% of every prize cheque now"»** –
  **FIXED, and the shape is: the memo prints ONE LINE PER RULE.**

  Your week 894 decomposes exactly: **$80,000 gross of prize at her 50% ramp** (the ledger's row is
  the family's net $40,000) **plus $35,000 of brand money at 85%** = $40,000 + $29,750 = $69,750 of a
  $115,000 base, which is **60.65% and rounds to the 61%** you read. Week 891 was a sponsor cheque
  alone and said 85%, correctly. **No figure was ever wrong. One sentence was averaging two rules and
  calling the average a rule.**

  ⚠⚠ **AND THE BLEND WAS A CORRECT ANSWER TO A SCREEN THAT NO LONGER EXISTS.** Round 29 P3 defined
  `kidShare.bps` as `cents / baseCents` so that the percentage would be a percentage of **the base
  #10 had put in the sentence**. Part two #2 took the base out of the sentence at your own ask («это
  усложнило и фразу и интерфейс») and round 30 #1 took it off the card. The constraint the blend was
  serving went away and what was left was a rate with nothing behind it.

  **THE SHAPE, stated as asked.** `accrueKidShare` now records each source's own rate beside the
  blend (`FinanceWeekKidShare.prize` / `.sponsor`) and the memo prints one sentence per rule that
  paid her that week:

  ```
  Her cut 50% – $23,438 into her own account.              <- one rule: YOUR sentence, unchanged
  Her prize cut 50% – $40,000 into her own account.        <- two rules: one word added, per line
  Her sponsor cut 85% – $29,750 into her own account.
  ```

  ⚠ **On every week governed by a single rule the string is yours to the character** – that is every
  week in the game before the manager's commission shipped, and most weeks after it. Only a genuinely
  mixed week prints two lines, and each is separately true: its percentage × its own gross = its own
  cents. The two source words are the game's own vocabulary, not new copy – the event feed already
  writes «her share of the **prize money**» and «her share of the **sponsor money**», and her page
  says «She keeps 50% of every **prize cheque** now. **Sponsor cheques** are hers, less the manager's
  15%.»

  ⚠ **Forward-only, and the reason is a house rule rather than laziness**: the two bases cannot be
  solved back out of a blend without exactly the division `accrueKidShare`'s header forbids. Weeks
  already banked keep the line they printed – and since this tile only ever draws `snapshot.week`,
  **your card corrects itself from her next cheque onward.** No migration, no golden fixture, schema
  still 66.

  ⚠⚠ **WHY THE ROUND 29 #10 PIN DID NOT CATCH IT – TWO PINS, TWO DIFFERENT BLIND SPOTS, BOTH FIXED.**
  This is the part that matters more than the item.

  1. **The engine pin (`round29-kid-cut-base.test.ts` §2) had become UNFALSIFIABLE.** Its claim is
     «the percentage the card prints must be a percentage OF the figure beside it». The moment P3
     defined `bps` as `cents / baseCents`, that assertion reads `round(base × round(cents/base)) ≈
     cents` – **arithmetic, not a property of the game.** It is true of any two numbers whatsoever, so
     no blend, however far from every rule, could ever redden it. ⚠ Worse: **that file's own fixture
     is a mixed week and its comment records the blend in as many words** – «a blend of 50% and 85%
     is 55.83% and renders as 56%». **Your «56%» was sitting inside a green pin.**
  2. **The mounted pin (`week-recap-kid-share.test.ts`) asks the right, falsifiable question** – «the
     percentage on screen is the ramp the engine paid her by» – **of a fixture that cannot contain the
     case.** `paid()` stops on the FIRST week the tennis paid her, which is prize-only by
     construction, and on a prize-only week the blend IS the ramp.

  **The repair is to pin the rate to a RULE rather than to the money.** New §3 in the engine file
  asks: is each printed rate a rate this engine STATES (`kidPrizeShareBps(age)`, or
  `10_000 − managerCommissionBps()`)? New mounted arm mounts a MIXED week and asks the same of every
  percentage on screen. ⚠ Mutation-verified, each applied alone and watched: three separate defect
  mutations turn all three new engine arms red **while §1 and §2 stay 7/7 green** – which is the
  demonstration, not the argument, that the old pins cannot see this class; the card ignoring the
  parts turns the new mounted arm red **alone**, with the #10 pin still green; and a retune of the
  commission (1500 → 2500) leaves the new arms green, correctly, while reddening the literals that
  must see a retune. A fourth arm pins your single-rule sentence byte-for-byte, and it goes red if the
  source word ever leaks onto a week that has only one rule.

- [~] **22. «ни одной травмы я не видел уже несколько сезонов, даже самой маленькой»** –
  **MEASURED, NOT TUNED, as this is a balance decision and it is yours. You are right, and there IS a
  defect: the hazard does not rise with age because THERE IS NO ADULT AGE CURVE AT ALL.**

  ⭐⭐⭐ **THE TERM RESPONSIBLE, NAMED.** `ECONOMY.availability.ageInjuryFactor`:

  ```
  { 13: 0.85, 14: 0.9, 15: 1.05, 16: 1.2, 17: 1.05, 18: 0.95, default: 0.85 }
  ```

  **`default: 0.85` is the table's LOWEST value, and it carries every year from 19 to retirement.** A
  body of 19, 25, 31 and 34 are the same body to this engine, and all four are 29% safer than a
  sixteen-year-old. ⚠ **The table is not wrong, it is UNFINISHED**: its own research
  (`docs/research/injury-stats-by-age.md`) scoped itself to the junior window – «our WTA-first kid
  starts at 14 → the sim window 14→18 spans the girl peak exactly» – and the `default` was the
  off-the-end fallback, not an adult limb. The same document says what the adult limb should be about
  and never supplied one: «Adults 18+: risk shifts to chronic lower-limb wear (48–56% lower limb),
  retirements rising». The game then grew careers to forty and the fallback quietly became the model.

  ⭐⭐ **THE REALISED HAZARD BY AGE BAND** – `tools/injury-audit.ts`, 9 presets × 12 seeds, arm
  `plays-on` (maximum late-career exposure), both entry policies. Nothing was written to any constant.

  | band | onsets/season, **grinder** | onsets/season, **careful** | wks lost/season (careful) | ageFactor |
  | --- | ---: | ---: | ---: | --- |
  | 13–15 | 1.72 | 0.77 | 1.7 | 0.85 / 0.9 / 1.05 |
  | 16–18 | 1.49 | 0.99 | 2.2 | **1.2** / 1.05 / 0.95 |
  | 19–22 | 1.78 | 0.88 | 2.3 | 0.85 |
  | 23–28 | **1.95** | 0.84 | 2.1 | 0.85 |
  | **29+** | **1.49** | **0.91** | **2.0** | 0.85 |

  (2,595 and 2,853 full seasons lived; the 29+ band alone carries 920 and 1,137 of them, so this is
  not thin.) **The curve is flat across adulthood and the 29+ band is the QUIETEST of the grinder's
  adult bands – fewer onsets and fewer weeks lost than at 23–28.** Nothing in the model pushes back
  on age, because the only age term cannot move after eighteen. ⚠ And she is not playing less: 29+
  is the band with the MOST events per season in both arms.

  ⭐ **WHERE YOUR CAREER SITS – and the answer depends entirely on what you have bought, which is
  itself the finding.** The weekly threshold at 31, computed exactly from the shipped constants:

  | | tau on a play week | expected onsets in 299 weeks | **P(zero)** |
  | --- | ---: | ---: | ---: |
  | no physio, condition 61, worn kit | 1.390%/wk | 3.61 | 2.7% |
  | budget physio, condition 61, half-worn kit | 0.928%/wk | 2.41 | 9.0% |
  | **elite physio, condition 85, fresh kit** | **0.385%/wk** | **1.00** | **36.8%** |
  | …and an elite recovery package live | 0.327%/wk | 0.85 | **42.8%** |

  ⚠⚠ **SO: AGAINST A GENERIC CAREFUL CAREER YOU ARE A TAIL (≈1 in 190 at the measured 29+ rate of
  0.91/season); AGAINST YOUR OWN PROTECTION STACK YOU ARE THE MODAL OUTCOME (≈1 in 3).** Those two
  answers differ by a factor of about seventy and the whole difference is your purchases.
  ⚠ **AND THE TWO ARE NOT LIKE FOR LIKE, SAID OUT LOUD RATHER THAN GLOSSED**: the 0.91/season is the
  bench's population rate through BOTH doors (the weekly roll and the in-match retirement hazard),
  while the table above is the WEEKLY DOOR ONLY – it is arithmetic on the shipped constants, not a
  walk. Round 16 measured the retirement door at most of all onsets, so the true P(zero) for a
  protected veteran is somewhere BELOW 37%. ⚠ How far below depends on a factor that also favours
  her: `retireHazard` reads in-match spentness, and a top-20 winning in straight sets accrues little
  of it. The direction of the finding does not move either way – **the age term is flat at its own
  minimum and cannot rise** – but the exact odds of your drought are bracketed, not pinned. Your
  lifetime rate is 11 injuries over 17.2 seasons = **0.64/season**, against the careful bench's 0.88
  – below it, not impossibly so. ⚠ The stack is worth roughly **4× on the threshold** (elite physio
  0.616, elite recovery 0.85, fresh kit 1.00 against a worn 1.32, and the condition it buys), and the
  age term – flat at its own minimum – has nothing to answer it with. **The game currently lets a
  wealthy family buy a body out of ageing.**

  ⚠⚠ **AND THE FIX IS A SHAPE CHANGE, NOT A LEVEL CHANGE – which is exactly why it is yours.** The
  aggregate is already HOT: season prevalence reads 58.5% (careful) and 76.0% (grinder) against the
  professional research band of **30–54%**, and `docs/backlog/injuries-gear-and-open-bugs.md` #7 is
  an open item about precisely that overshoot. So «more injuries at 30+» must be paid for by fewer
  somewhere else, or the whole model gets hotter still. **Nothing was tuned. The one-line shape of
  the change is an adult limb on `ageInjuryFactor` (e.g. 19–24 flat, then rising through the
  thirties), and it needs your number, a bench run and a re-pin.**

- [~] **23. ⚠⚠ MERCH IS MODELLED AS THE WRONG THING – his research, and it is decisive.** «что там
  происходит в мире на эту тему с личными брендами мерча у спортсменов? Мне кажется это странным
  немного, если честно, то как сейчас это у нас работает.»

  **FOLDED IN, MEASURED, AND THE CORRECTION IS SPECIFIED BUT NOT APPLIED – one decision is yours and
  it is named at the bottom.** All of it is now `docs/research/player-brands-and-what-they-are-worth.md`
  **§7**, kept as its own section rather than scattered through §1–§5 because the provenance differs:
  §1–§5 were read here in the primary document, §7 is yours as you stated it. That difference is
  written at the head of §7 so nobody quotes the two at equal weight.

  ⚠ **YOUR RF CORRECTION IS TAKEN AND THE OLD CLAIM IS GONE, not left standing beside it.** The page
  said «no published valuation of the RF mark exists». That was too strong: **~$27M is an attributable
  expert estimate** and now stands as the working figure in the lead paragraph, in §1's table and in
  §6. What survives is narrower and still true – it is an **estimate, not a price**: no transaction,
  no filing, no audited valuation. Quote the order of magnitude, not the dollar.

  ⭐⭐⭐ **AND YOUR RARITY FINDING IS THE ONE THAT CHANGES THE DIAGNOSIS** (§7a). If ~95% of active
  top-20/50 players take classic sponsorship and a full personal business belongs to historic
  superstars, then our shelf is not merely mispricing the brand – **it is selling the rare thing as an
  ordinary rung** ($250,000, general shelf, any family that can afford it), while the ordinary
  top-20's off-court money in life is somebody else's brand paying her, **which this game already
  models in the ad and kit ladders**. One instrument is doing two jobs.

  ⭐⭐ **THE RE-SIZE, MEASURED** (`tools/merch-fame-vs-rank.ts`, 9 presets × 8 seeds × 780 weeks):

  | | fame | merch pays | against the researched band |
  | --- | ---: | ---: | --- |
  | first week they can afford it (median) | 9.6 | $288/wk = **$15.0k/yr** | – |
  | peak fame, median career | 58.9 | $1,767/wk = **$91.9k/yr** | **5.4–22× under** |
  | peak fame, p90 and best | 100.0 | $3,000/wk = **$156k/yr** | **3.2–12.8× under** |

  The band is $0.5M–$2M/yr NET for a top full own-brand, derived in §7d from your own figures through
  this page's own multiples (Sugarpova's $20M peak valuation, EleVen's $5–12M turnover). ⚠ Income,
  turnover and valuation are three different units and §7d converts them explicitly rather than
  averaging them.

  ⚠⚠ **BUT THE BOTTOM OF OUR CURVE IS RIGHT AND IS DELIBERATELY CALIBRATED.** At the median purchase
  fame the brand yields **6.0% a year on its $250,000** against the index fund's 7% – exactly the
  anchor `ECONOMY.business.merch` states, confirmed live. **A flat multiplier would break the end that
  is right to fix the end that is wrong.** So the shape is FORCED rather than chosen: hold the anchor,
  reach the band, and the only curves left are convex. The simplest, pivoted on the anchor itself
  (`weekly = perFamePointCents × fame² / 10`) is identical at fame 10, puts the median career's peak
  at **$541k/yr** (the band's floor) and a fame-100 superstar at **$1.56M/yr** (its ceiling).

  ⚙ **WHY IT IS NOT APPLIED, AND WHAT I NEED FROM YOU.** The brand is also an ASSET and its worth is
  `earningsMultipleX` (16) × a year of its own income – **income and worth are the same dial.** Under
  the convex curve the purchase-day worth is unchanged (median $239,761 against a $250,000 price, the
  «fair on the day they can afford it» criterion #9 chose 16 for), but **the peak worth becomes ~$8.7M
  on a $250,000 purchase** – bigger than most of the shelf and closing on the $12M academy. The two
  criteria cannot both hold under one multiple once the curve bends. **Two questions, both one edit:**
  *(a)* may the merch brand become an eight-figure asset at a superstar's fame, or should the income
  rise while the valuation is held down (a fame-dependent multiple)? *(b)* given §7a, is «make the
  existing instrument bigger» even the right repair, or should an ordinary top-20's off-court money
  come through the sponsorship ladder that already exists and the own-brand stay a superstar's thing?

  ⚙ **Collaborations, equity and royalty lines are NOT built**, per «но не сейчас». They are recorded
  in §7b as the future shape: Federer's ~3% of On peaking near $500M and out-earning 24 years of prize
  money (⭐ §3 of the page reaches ~$603M at the same peak by an independent route – the strongest
  cross-check in the document), Djokovic's $5–10M/yr Asics royalties, Świątek and Shelton on stock
  options.

- [~] **24. ⚠ The fame floor ignores «выступления» – «она же топ-20 в мире».** **BENCHED, BEFORE AND
  AFTER, AND NOT SHIPPED – the numbers are below and the choice is yours.**

  ⚠ **FIRST, A CONSTRAINT NOBODY HAD CHECKED: THERE IS NO DEEP-RUN LEDGER TO READ.** `TierTrophies`
  stores `titles` and `finals` and **nothing below a final**, so a quarter-final leaves no durable
  trace anywhere in the save. «Count deep runs» is therefore a schema move, not a floor tweak – and it
  does not need to be, because `seasonHistory[].byTrack.wta.endRank` is already written for every
  finished season, and **a season ended at #18 IS her deep runs, summed and sorted by the tour
  itself.** So the measurable answer is a BAND LADDER on the season's end rank.

  **SHIPPED IN THIS WAVE: the plumbing only.** `ECONOMY.fame.top10SeasonFloor` became
  `ECONOMY.fame.seasonEndBands`, a ladder in the shape `academy.reputationBands` already uses. ⚠ **As
  shipped it has ONE rung and is the old rule exactly – not one cent moves anywhere** (34/34 green
  across `round29p5-business` and `round30-brand-value`). It exists so this item is a measurement
  rather than an argument: `tools/merch-fame-vs-rank.ts --seasonBands 20:4,50:1.5` swaps in a
  counterfactual for one run and prints the arm in its header so no output can be misfiled.

  ⭐⭐ **BEFORE / AFTER** – same 72 careers, same seeds, the only difference being two extra rungs
  (a season ended top-20 = +4 fame, top-50 = +1.5, against the top-10's existing +10):

  | | shipped | with the two rungs | |
  | --- | ---: | ---: | --- |
  | peak fame, median career | 58.9 | **67.5** | **+14.6%** |
  | peak merch income, median | $91.9k/yr | **$105.4k/yr** | +14.6% |
  | fame the week they can first afford the brand | 5.0 / **9.6** / 19.4 | 5.0 / **9.6** / 19.4 | ⭐ **UNCHANGED** |
  | brand's worth on the day they buy it (median) | $239,761 | **$239,761** | ⭐ **UNCHANGED** |
  | brand's worth at the career's peak (median) | $1.47M (5.9×) | **$1.69M (6.7×)** | +14.7% |
  | climbing 52w windows where income FELL | 15.1% | **13.7%** | |
  | seasons in which the brand's VALUE fell | 29.0%, median −17.9% | **26.6%, median −16.3%** | |

  ⭐ **THE TWO ROWS THAT MAKE IT SAFE ARE THE UNCHANGED ONES.** The purchase-day economics do not
  move at all – a family reaches first affordability before it has finished top-50 seasons to bank –
  so round 30 #9's «fair on the day they can afford it» multiple and the fund-parity anchor both
  survive untouched. The lift lands where you asked it to: **the middle of the distribution**, since
  p90 and best are already at the fame cap.

  ⭐⭐ **AND IT PARTLY ANSWERS ROUND 30 #13 AS A SIDE EFFECT** – «merch brand приносил 600+, а через
  несколько месяцев стал 500+, хотя позиция в таблице уже 15». A top-20 season now feeds the stock
  **while she is climbing**, so climbing windows that lose income fall 15.1% → 13.7% and the seasons
  in which the brand loses value fall 29.0% → 26.6% with a shallower median drop.

  ⚠ **THE STRUCTURAL CLAIM, which is arithmetic and not a measurement**: for a career with no title,
  no Slam final and no top-10 season the floor today is **exactly zero**, so her brand is worth
  **nothing** however high she ranks. The bench cannot show that as a percentage because its careers
  do win things; the change for that career is from invisible to visible, not from N to N+15%.

  ⚙ **NOT SHIPPED because it moves merch income and the brand's worth on every career, and because it
  is coupled to #23's open question above** – if the dial or the multiple also moves, these two rungs
  want re-sizing with it. **+4 / +1.5 are my proposal, not a measurement: say the numbers and it is
  one line plus a bench re-run.**


- [~] **26. ⚠⚠ «богатая семья может купить телу освобождение от старения… вот это очень странно
  звучит как по мне. Что можем с этим сделать?»** – **his question, and the answer is a principle this
  house already holds but never applied to age.**

  **What was measured** (round 30 #22): `ECONOMY.availability.ageInjuryFactor` is
  `{…18: 0.95, default: 0.85}` and `default` – **the lowest value in the table** – carries every year
  from 19 to retirement. Nineteen, twenty-five and thirty-four are one body, all 29% safer than a
  sixteen-year-old. The protection stack (elite physio 0.616 × fresh kit × recovery buff) is worth
  **~4× on the weekly threshold**, and a flat age term has nothing to answer it with.

  ⭐⭐⭐ **The rule already exists, one file away.** `kitInjuryFactor`'s own note: «the FLOOR is new kit,
  at exactly 1 – the top rung cannot go below it, so **no amount of money buys a safety BONUS, it only
  buys back the penalty** of playing on worn kit». **Money undoes its own harm and never buys an
  advantage.** That is the house's answer to exactly this shape, written for gear and never extended
  to age.

  **So the proposal is not a new idea, it is an unapplied one:**

  1. ⭐ **Age becomes a FLOOR the multipliers cannot go under**, precisely as new kit is. A physio, a
     masseur and fresh shoes buy back wear and bad luck; they do not buy youth. ⚠ In life this is
     simply true – a fortieth-year knee is a fortieth-year knee whatever the medical team costs.
  2. **The curve stops being flat after ~27-28** and rises to retirement, which is what the sport does.

  ⚠⚠ **And the constraint that stops this being a free win**: prevalence already measures **58.5% /
  76.0%** against the researched **30–54%** band, so it is ALREADY too high. **Adding injuries at 30+
  must be paid for elsewhere** – this is a RE-SHAPE of the curve, not a level rise, and the total has
  to land back in band. ⭐ That also makes it a better change than it first looks: the young end gets
  quieter, the old end gets honest, and the total gets closer to the research than it is today.

  ⚠ It moves every career: a bench, a spec recording predicted-vs-measured, and a frozen re-pin.
  ⚙ **SETTLED**: he authorised the measurement («давай, ставь замер»), it ran, and it **corrected
  this item's own premise** – the stack is worth 9% on realised injuries, not 4×, and his drought is
  a tail at ≈1 in 45. His follow-up ruling is item **27**, which supersedes this line.
---

- [x] **25. NOT YOUR ITEM – THE WAVE'S OWN DEFECT, FOUND AND REPAIRED ON 30.08.** «Main is at N» is a
  fact with a shelf life, and three agents in this wave read it at the only moment it was true.

  **WHAT WENT WRONG.** Amending an UNSHIPPED migration step instead of taking a new version is
  legitimate and it is the rule this repo runs on: append-only bites at the moment of **shipping**,
  and a version `main` has never seen has no saves in the world to break. Three separate agents
  applied that rule to v66 – the sailing-yacht rename (round 29 P1), the fund's units (#14) and the
  brand/academy name (#8/#10) – each having checked `origin/main`, each having found **65**, each
  having written the reasoning into the step. Then **PR #114 merged round 29 and `main` declared 66.**

  ⚠ **Nothing about their code became wrong. Its PREMISE expired underneath it** – and that is the
  part no review catches, because the diff still reads correctly and every test still passes.

  **WHAT IT DID TO YOUR SAVE, measured on `alice-cfbv_w896` (read-only, never copied).** You are
  playing a `main` build, so your save says `schemaVersion: 66`. On installing this wave's build,
  `migrateSave` would see 66, decide there was nothing to do, and **skip the step entirely**:

  - `index-fund` and `deposit` keep `basisCents`/`basisWeek` and never gain `units` – and the shipped
    value function is now `units × price`, so it would have multiplied by `undefined`;
  - `merch-brand` never gains a name, and the picker is only offered on a FIRST purchase, which is
    720 weeks in your past. A nameless business, for ever, with no way to name it.

  ⚠⚠ **A migration that never runs is worse than one that runs wrong: it is silent.**

  **THE REPAIR.** The two back-fills that had NOT shipped moved to a new **v67** step, unchanged;
  `SAVE_SCHEMA_VERSION` is 67; `tests/fixtures/saves/v67.json` and the README row are added. ⚠ The
  yacht rename did **not** move – it went out INSIDE v66 (`eaf61759`), so it is frozen with the rest
  of that step, and v66's migration and its golden fixture are now **byte-identical to `origin/main`**.

  ⭐ **THE PROOF IS A TEST THAT STARTS WHERE YOU START.** Every migration arm in this repo entered at
  v65 or below – and from below the rung, a step numbered 66 and a step numbered 67 are
  indistinguishable, which is exactly why the whole suite stayed green over a broken save. The new
  arm builds a v66 save in your save's shape (retyped from it, never copied) and walks it to 67.
  **Mutation-verified by restoring the defect**: 1 failed – the new arm, `units` undefined – and
  **102 passed**, every older arm and the entire golden corpus included. That 102 is the finding.

  **THE RULE, and it is about WHEN rather than what** – now in the header of `src/engine/migrations.ts`:

  > Re-read `git show origin/main:src/engine/world/state.ts` **at the moment you BUMP**, and again
  > when you assemble the PR – in a wave that runs for days across several merges that is a different
  > day. If main's constant already equals the version you are amending, that version is **shipped**:
  > take the next number, move your additions to it, leave main's step byte-identical.

  ⭐ **AND A MACHINE CHECK, because a rule nobody can forget is better than one everybody must
  remember.** `scripts/schema-ladder.mjs` fails when this branch's `SAVE_SCHEMA_VERSION` equals
  main's while the step producing that version differs from main's. Verified against the real
  pre-repair tree: it exits 1 and names the fix. ⚠ **It is a CI step and not a unit test, on
  purpose** – it reads `origin/main`, a remote-tracking ref is only as fresh as the last fetch, and a
  check reading a stale one would give the same wrong answer from the same expired fact. A guard that
  can reproduce the bug it guards against is worse than none. So CI fetches first (one line, on a
  runner that is already on the network) and `npm run check` stays offline and deterministic.

  ---

  **MEASURED, 30.08 – and the headline is that he is a TAIL, not a defect.** Full working in
  `docs/specs/age-injury-curve-2026-08.md`; the sourced age evidence is
  `docs/research/injury-stats-by-age.md` **§5**. ⚠⚠ **NOTHING SHIPPED: `src/` carries no diff, the
  fitted curve is a proposal, and the frozen MAIN capture (41550 / `e6b0c709`) is verified UNMOVED.**

  ⭐⭐⭐ **1. HIS DROUGHT, BY SIMULATION, THROUGH BOTH DOORS – ≈ 1 IN 45, AND HIS MONEY BARELY MOVES
  IT.** 190 careers walked week by week through `stepCareerWeek`, 151,123 adult weeks lived from age
  25, every onset attributed to the door it came through:

  | arm | 299-week windows | **CLEAN** | mean tau | onsets/100w | **via the RETIREMENT door** |
  | --- | ---: | ---: | ---: | ---: | ---: |
  | a generic careful career | 46,170 | **2.2 %** | 0.559 % | 1.68 | **72.6 %** |
  | his rungs (elite medical team) | 25,596 | **2.2 %** | 0.453 % | 1.61 | **78.6 %** |
  | **his stack** (elite team + new-kit floor) | 24,441 | **2.0 %** | 0.429 % | 1.53 | **78.1 %** |

  ⭐ The control that makes it his: the bench's careful career competes in **45.2 %** of its adult
  weeks and **his own file reads 45.3 %**. Same schedule, not a busier one.

  ⚠⚠ **NEITHER OF #22'S TWO FIGURES SURVIVES, AND #22'S CENTRAL CLAIM NEEDS CORRECTING.** «≈1 in 190»
  and «≈1 in 3» were both the weekly door only. Through both doors it is **1 in 45**, and the whole
  stack is worth **2.2 % → 2.0 %** – because `retireHazard = RETIRE_K × spentness × retireDurability`
  has **no physio term, no kit term and no age term in it at all**, and it supplies three quarters of
  every adult injury. So «the game currently lets a wealthy family buy a body out of ageing» is too
  strong: on the THRESHOLD the stack is worth 23 %, on **injuries she actually suffers** it is worth
  **9 %**. ⭐ And one correction that moves his odds the unfavourable way: his elite recovery buff had
  **three weeks left on it** off a holiday booked the week before he exported – it is not a standing
  part of the stack, and #22's 0.327 %/wk row is a buffed WEEK, not a drought.

  ⭐ His lifetime rate is **0.64 onsets/season against the careful bench's 0.88**. He is a tail inside
  a career that was already running a little lucky. **The drought is luck. The flat age term is still
  a defect, and it is a smaller lever than it looked.**

  ⭐⭐ **2. THE REAL-WORLD CURVE – and the headline there is a `[GAP]`, not a number.** There is **no
  published age-stratified injury incidence for professional women's tennis**: the field's own
  consensus paper (Pluim et al., *BJSM* 2021) recommends a single **adult 19–49** band, and the 2024
  French Open surveillance paper says in as many words it could not evaluate age because the
  non-injured players' demographics were unavailable. ⚠⚠ **And the two studies that DID test age in
  the WTA both returned NULL** – Palau et al. (*PLOS ONE* 2024, 267,380 matches) and Oliver et al.
  (*EJSS* 2024, 46,268 matches), both on mid-match retirement risk. The only quantified rising-
  incidence proxies are football's **2.3×** (Premier League) to **4.9×** (LaLiga), 30+ against
  under-21 – the least transferable evidence there is. **So the limb is a PROXY and is licensed at
  ~1.5–2×, no more.** ⭐⭐ What tennis DOES show with age is **burden, not incidence**: the severe
  share (>28 days) runs **43 % in adolescents against 54–66 % in professionals** – and
  `ageInjuryFactor` cannot express that at all (see 5 below).

  ⭐⭐⭐ **3. THE FITTED CURVE – 51.4 %, INSIDE THE BAND, MEASURED NOT PREDICTED.** ⚠ First the thing
  nobody had measured: **with the weekly injury roll switched off at EVERY age, prevalence is still
  45.8 %.** So the entire reachable window for this table is **45.8 % – 58.5 %** against a 30–54 %
  band – it can land in the band's **top quarter and nowhere else**, and three of the five bands
  cannot reach the band's midpoint even at zero. The retirement door is most of the level problem and
  `ageInjuryFactor` is not the instrument for it.

  ```ts
  ageInjuryFactor: {
    13: 0.6, 14: 0.63, 15: 0.74, 16: 0.84, 17: 0.74, 18: 0.67,   // the shipped junior SHAPE x0.7
    19: 0.25, …, 27: 0.25,                                        // the prime, flat
    28: 0.29, 29: 0.32, 30: 0.36, 31: 0.39, 32: 0.43, 33: 0.46,   // the rise, linear, x2 by 34
    default: 0.5,                                                  // 34 to retirement
  }
  ```

  | band | shipped | predicted | **MEASURED** | Δ |
  | --- | ---: | ---: | ---: | ---: |
  | 13–15 | 52.5 % | 49.4 % | **49.7 %** | −2.8 pp |
  | 16–18 | 64.5 % | 60.5 % | **59.0 %** | −5.5 pp |
  | 19–22 | 58.6 % | 49.5 % | **45.8 %** | −12.8 pp |
  | 23–28 | 56.6 % | 49.1 % | **50.5 %** | −6.1 pp |
  | **29+** | 59.5 % | 55.1 % | **52.3 %** | −7.2 pp |
  | **OVERALL** | **58.5 %** | 52.9 % | ⭐ **51.4 %** | **−7.1 pp** |

  ⭐ **And the shape is the one you asked for**: onsets/season now read **0.68 → 0.68 → 0.78** across
  19–22 / 23–28 / 29+, where the shipped table reads 0.88 → 0.84 → **0.91 with 29+ the second-quietest
  adult band.** The oldest band is the worst adult band for the first time.

  ⚠ **The junior rows move, and it is not scope creep**: 16–18 measures **64.5 % against its own
  researched 46–54 %** – the most over-band row in the table – and ×0.7 keeps the peak at 16 and the
  whole relative ladder §3.1 sourced, moving only its height. 13–15 stays inside its own band
  (52.5 % → 49.7 %).

  ⚠ **A LEVEL-NEUTRAL ALTERNATIVE IS MEASURED TOO, IF YOU WOULD RATHER NOT MOVE THE LEVEL IN THE SAME
  EDIT** (prime 0.6 rising to 1.2 at 34, juniors untouched): **58.4 % overall against the shipped
  58.5 %** – the prime falls (58.6 → 52.8), the veterans rise (59.5 → **63.1**), and the aggregate does
  not move at all. Same shape, no level change, does not land in band because it is not trying to.

  ⚠ **The grinder cannot be brought into band by any age curve** – 76.0 % → 71.5 % under the fitted
  curve, and its own floor with the roll switched off is **67.8 %**. It runs at mean condition 55, so
  its injuries are a fatigue story.

  ⭐⭐ **4. THE FLOOR, MEASURED – and money still helps at 20 and cannot rescue at 34.** ⚠ The two
  obvious ways to write your rule are both NULL, and the reason is arithmetic: a floor of the form
  `tau ≥ injuryBaseChance × ageInjuryFactor(age)` puts the age factor on **both sides** of the
  comparison, so it divides out and the protected/unprotected ratio is identical at 20 and at 34. The
  floor has to sit on the **protection PRODUCT**:

  ```
  protection      = physioRiskFactor × recoveryBuffFactor            // kit excluded: never below 1
  protectionFloor = pBest + (1 − pBest) × climb(age)
  tau            *= max(protection, protectionFloor(age))
  ```

  ⭐⭐ **and `climb(age)` has no free numbers in it – it is read off the age curve itself**:
  `climb = (ageF(age) − ageF(prime)) / (ageF(top) − ageF(prime))`. **The share of her protection age
  has taken is exactly the share of the age curve she has already climbed.** The two cannot drift
  apart in a later re-tune.

  | age | floor | **% off tau still buyable** | tau with the full stack | unfloored |
  | ---: | ---: | ---: | ---: | ---: |
  | **20** | 0.524 | **47.6 %** | 0.069 % | 0.069 % |
  | 24 | 0.524 | **47.6 %** | 0.069 % | 0.069 % |
  | **28** | 0.600 | **40.0 %** | 0.091 % | 0.080 % |
  | 30 | 0.733 | 26.7 % | 0.139 % | 0.099 % |
  | 32 | 0.867 | 13.3 % | 0.196 % | 0.118 % |
  | **34** | **1.000** | **0.0 %** | **0.262 %** | 0.137 % |

  ⭐ A fully-equipped 34-year-old ends at **3.8× the threshold of a fully-equipped 20-year-old**,
  where the curve alone gives 2.0×. **The floor is what makes the age curve legible to a wealthy
  family at all** – without it, money just shifts the whole curve down 47.6 % and the shape reads the
  same. ⚠ It costs nobody who did not buy protection (`protectionFloor` maxes at exactly 1, so an
  unprotected family's `max` is a no-op at every age) and it can never raise a threshold above the
  unprotected one. **Population cost bracketed at +1.8 pp upper bound** (fitted curve with the medical
  team worth nothing at every rung and age: 51.4 % → 53.2 %) – both ends inside the band, so the floor
  is safe to add on top of the fitted curve without re-fitting.

  ⚠⚠ **5. WHAT THE MEASUREMENT SAYS YOU SHOULD PROBABLY DO INSTEAD, OR AS WELL.** Two things, both
  bigger than a table edit and neither proposed here:
  - **The retirement door has no age term and it is three quarters of the problem.** A 2× age curve
    buys a **15 %** rise in realised 29+ onsets, because everything else comes through a door the
    curve does not reach. If ageing should be something a player can FEEL, that is the lever.
  - **The best-sourced tennis age effect is on SEVERITY, and this table cannot express it.** Under the
    fitted curve **weeks lost per season barely move** (2.1 → 1.7 overall, and flat at 1.7/1.6/1.7
    across the adult bands): only the COUNT moved, not the consequence. An age-scaled `severityBands`
    draw is what the literature actually supports.

  ⚙ **STILL `[?]` – four questions, each one edit:** *(a)* the fitted curve or the level-neutral one?
  *(b)* the floor with it, or the curve alone? *(c)* may the junior rows move (they are why the total
  lands in band)? *(d)* the two in 5 above are separate waves – do you want either?


- [>] **27. ⚙ HIS RULING ON THE INJURY SHAPE (30.08), three parts** – «тяжесть надо взять точно, но
  разумно. Однако и с показателем в 1 травму в год надо что-то делать, раз я не увидел ни одной за
  большой промежуток. А еще, раз мы **храним историю травм** у себя, то вполне можно делать алгоритм,
  который будет увеличивать немного вероятность **новой такой же травмы или ее прогрессии** (более
  тяжелой). Мне кажется это похоже на правду. Что скажешь?»

  ⭐⭐⭐ **My answer: recurrence is the best of the three and it repairs the second one.**

  **1. Severity by age – TAKE IT, «разумно».** It is what the literature actually supports: tennis
  shows **burden rising with age, not incidence** (severe share 43% → 54–66%), while both WTA studies
  that tested age for INCIDENCE returned null. ⚠ So this is the honest limb and the age-frequency
  curve is the licensed-but-weak one.

  **2. The rate – ⭐⭐ he is describing TEXTURE, not frequency.** Measured onsets are 0.68–0.78 a
  season and his own lifetime rate is 0.64; the number is not the complaint. **Independent weekly
  draws produce exactly the forgettable pattern he is describing** – nothing, nothing, a niggle,
  nothing. **His 5.8 quiet years are a side effect of independence**, not of a low rate.

  **3. ⭐⭐⭐ Recurrence – the strongest of the three, and the reason it fixes 2.** *Previous injury is
  the best-established risk factor in sports-injury epidemiology*, ahead of age and load. And it
  CLUSTERS the same total: «three quiet years, then the ankle went twice in one season» is both truer
  and memorable, where independence is neither. ⭐ The data already exists – `injuryHistory` holds
  `kind`, `severity`, `week`, `weeksOut`, so **no schema move.**

  ⚠⚠ **The design caution that must be built in from the start**: «мы ни за что не наказываем». A
  first injury may not doom a career, so escalation needs **a ceiling and a decay** – an ankle that has
  been sound for three seasons stops being the weak ankle. Without the decay this is a death spiral
  dressed as realism.

  ⚠ And the measurement's own verdict stands beside all three: **the in-match retirement door supplies
  73–79% of adult onsets and carries no age term at all**, so a frequency curve is a small lever
  whatever else is done. Recurrence should reach BOTH doors or it will inherit the same limit.
