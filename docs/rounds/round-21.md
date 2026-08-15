# Round 21 – a full playtest on the 128-draw build, 12 items (14.08.2026)

Measured against `tennis-sim_ines-xgv7_w362.tsave` – his own save, read locally, never committed,
never a fixture. Played on `main` at `6c7507b`, i.e. the first playtest that carries today's
opener-price and real-draw waves.

Status: `[x]` shipped on the branch · `[~]` answered, nothing to build · `[>]` in flight, agent named
· `[ ]` open · `[?]` waiting on the owner's answer · `[!]` REOPENED (was reported done, was not).

- [ ] **1. «Загрузка сейва, нужен диалог, подтверждающий намерение, особенно актуально, если сейв
  перетирает существующий.»** – BUILD. Importing a save is destructive and currently silent. Wanted:
  a confirm step before the import lands, and it must say plainly WHEN it is overwriting a career
  that already exists rather than warning identically in both cases.
- [ ] **2. ⚠ REOPENED, THIRD ASK. «Тренер всё ещё не едет на соревнования, как так? Уже 3й раз прошу
  сделать»** – BUILD. Round-20 #1 answered this with an explanation instead of a build: the mechanic
  was measured in three versions on 30.07, all three failed, he cancelled it, `docs/decisions.md`
  recorded the consequence, and I relabelled the toggle to say why it will never open.
  **Asking a third time overrules that cancellation.** `setCoachOnEventWeeks` still has no caller
  anywhere in `src/`. This time it gets wired, and the toggle has to do something on his screen.
- [ ] **3. ⚠ REOPENED. «И ещё раз: проверь пожалуйста что с комментариями текстовой трансляции на
  1000 и шлемах, кажется ничего не изменилось»** – MEASURE, then build. Task #109 was created for
  exactly this and never built, so "ничего не изменилось" is the correct observation. Read what a
  1000/Slam match actually emits against what a J30 emits, on the real commentary builder.
- [ ] **4. «...только 1 раз за весь сезон смог пройти 1й раунд турнира из всех попыток, в 250 чуть
  лучше. Это как-то не очень метчится с нашим процентом побед»** – MEASURE FIRST, and it may be MY
  regression: the Slam draw went 32 -> 128 and the 1000 32 -> 64 this morning. More rounds means more
  first rounds, and a 128 draw from the same entrant band may SEED her differently. Answer with the
  per-round rate on the new draws against the old, off his own save.
- [ ] **5. ⚠ REOPENED. «И мне всё ещё показывают local чемпионаты в ленте у обоих»** – BUILD. This is
  task #84, pending since it was filed and never built. The feed offers rungs that pay into a table
  she has left.
- [ ] **6. «Если день рождения в декабре, то вся школа уже закончилась и в сентябре вроде бы её быть
  не должно, мы это обсуждали. Надо везде по коду проверить этот сдвиг»** – BUILD + AUDIT. The school
  clock has to read her BIRTH MONTH, not a calendar constant, and he is asking for the whole code
  swept rather than one site fixed. Related to task #87.
- [ ] **7. «У тренера на карточке "Too early to tell 49 weeks of 52" – звучит довольно смешно, сезон
  уже сыгран.»** – BUILD, and it is three asks in one sentence:
  - 7a: the copy at the top of the window should be «обсудим в межсезонье», not "too early to tell".
  - 7b: drop the "of 52" framing – a rolling 52-week bar is the wrong clock for a question the
    season answers.
  - 7c: make it depend on WHEN the coach was hired. First half of the season -> "too early" is fair;
    second half -> it should already be saying "not long enough yet" and moving its own bar down the
    year. **He asks whether it already works that way – check before building.**
- [ ] **8. «В 19 не было варианта выбрать колледж, только про или завязать»** – BUILD. Task #102 has
  the design (college as a second act, not a coda) and nothing was built. At the fork she is offered
  two doors where the spec says three.
- [ ] **9. «Попап с развилкой появился сразу после финального матча чемпионата перекрыв интерфейс
  таблицы и завершения. Нам надо как-то всё-таки разобраться с порядком появления попапов, чтобы они
  не конфликтовали с происходящим на экране... кроме травмы, которая как раз должна появляться в
  моменте.»** – BUILD, and the general rule is the deliverable rather than the one collision: a
  blocking popup must wait for the screen to be idle, with the injury popup the stated exception.
- [ ] **10. «В разделе bills возле выбранной позиции и "# good weeks" написать "(3 left)" – сколько
  осталось»** – BUILD. A commitment shows how many good weeks it bought and not how many are left.
- [ ] **11. «Выбранного тренера давай в жёлтую рамку возьмём и чтобы портрет его подсвечивался
  всегда, независимо от дохода семьи.»** – BUILD. Two things: an accent frame on the CHOSEN coach,
  and his portrait lit whether or not the family can currently afford his tier.
- [ ] **12. «у нас есть ещё %, надо их тоже учитывать и суммировать, а то на счету 1млн, а элитного
  тренера какого-то нельзя брать.»** – BUILD or ANSWER, decide after reading the gate: the
  affordability check ignores income that is not the bank balance, so a millionaire is refused an
  elite coach. Find what the gate actually reads.
