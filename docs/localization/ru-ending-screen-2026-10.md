---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-07
---

# RU-12A – Epilogue screen and hand-off controls

Source: `src/components/EndingScreen.vue`. This is the UI frame around the engine-authored
**last page**, the full milestone record and the real album book opened from this screen. It
does **not** translate those page corpora (RU-12B and RU-07A/RU-16). All
Russian lines are `DRAFT`, except established shared terms `Дом` and `Рейтинг`.

Re-keyed 07.10 to the live source after rounds 47/48 ([RU-18](ru-main-delta-2-2026-10.md)). A row
that is not a plain draft carries a trailing mark in its Russian cell: `QUESTION` – the English
label was renamed and the owner's Russian is awaited (nothing is invented in its place);
`APPROVED` – his ruling; `⚙ removed` – the row left the screen, kept only as history, it
compiles nowhere.

| Surface | English | Russian draft |
| --- | --- | --- |
| dialog accessible name | `Epilogue` | `Эпилог карьеры` |
| record heading and link | `The whole record` | `Вся история` |
| record return | `Back to the album` | `Вернуться к альбому` |
| record season age | `she was {ageYears}` | `ей было {ageYears, plural, one {{ageYears} год} few {{ageYears} года} many {{ageYears} лет} other {{ageYears} лет}}` |
| empty record | `Nothing was ever written down. That happens.` | `Здесь не осталось записей. Бывает и так.` |
| final page heading | `The last page` | `Последняя страница` |
| portrait alt | `Aged {stage}` | `Портрет: возрастной этап «{stage}»` |
| real album door | `View the album` | `Посмотреть альбом` |
| visible test export | `Export save (dev)` | `Экспортировать сохранение (тест)` |
| family's prize share | `Family's share` | `Доля семьи` · ⚙ removed 07.10 (round 48 #3) · ⚙ 11.10 ключ умер, ряд исторический – в ячейке метка, живой английской строки под ней нет `QUESTION` |
| permanent outlay | `Tennis & trips` | `Теннис и поездки` · `APPROVED` 08.10 (his own wording; `docs/decisions.md`) |
| daughter's account | `Her account` | `Её счёт` |
| still owned holdings | `Still owned` | `Осталось в собственности` · ⚙ removed 07.10 (round 47 #6) · ⚙ 11.10 ключ умер, ряд исторический – в ячейке метка, живой английской строки под ней нет `QUESTION` |
| current portfolio value | `Family's portfolio` | `Капитал семьи` |
| seasons | `Seasons` | `Сезонов` |
| best rank | `Best rank` | `Высшее место в рейтинге` |
| titles | `Titles` | `Титулов` |
| one-more-year refrain | `You said one more year {count} time/times.` | `«Ещё один год», – говорили мы. Так было {count, plural, one {{count} раз} few {{count} раза} many {{count} раз} other {{count} раз}}.` – ⚙ 11.10 в коде фраза собрана из кусков: ряд целиком не ложится на один ключ `QUESTION` |
| resume college fallback | `Another year –` | `Ещё один год –` |
| new unrelated childhood | `Raise another` | `Новая история` · `APPROVED` 07.10 (his own wording, spec §9.9a) |
| dynasty, daughter lived during tour | `Raise her daughter` | `Вырастить её дочь` |
| dynasty, child born after career | `Dynasty` | `Династия` · `APPROVED` 08.10 («Династия берём, меняй обе стороны» – the cross-language one-word pick; it superseded his «Ребёнок позже» of the same morning, offered with a stated reservation) |

`Новая история` is the owner's own wording (ruled 07.10, spec §9.9a, in place of both drafted
options – the retired pair is quoted in RU-18). It names a **new, unrelated** career routed to the
childhood opening, not an instant thirteen-year-old and not this player's granddaughter. The two
adjacent dynasty actions must stay distinguishable from it. The dynasty variants are always
available on a final ending, regardless of whether a child was born during the played career;
availability does not encode parental merit.

`Dynasty` is the owner's 08.10 cross-language pick (one word, identical in both languages, the mechanic's own name; before it round 48 #6 had the gender-neutral «A child came later» –
`Raise her daughter` is unchanged and still says «daughter»), so a Russian line that names a
daughter does not translate it. Nothing on the page names or ages the child.

The old seven-page ending reel and its `Back`/`Next` arrows are no longer displayed. The ending
opens on its last page; `Посмотреть альбом` opens the actual album book, whose own navigation is
covered by RU-07. Returning from that book must restore the last page, not a deleted reel page.

`Tennis & trips` (the old `Spent`, renamed in round 48 #3 by the owner's own word) is
`outlayCents`: every outflow row of the career ledger from week 0, **minus the shelf** – the cost
of the assets still held, the cost of units already sold on, and the assets' upkeep (round 48
3b-2). Coaching, staff and physio, travel and vacation, entry fees, facilities, gear and
stringing, academy stages and tuition are all inside it; the houses and yachts are not. The
source spells the label `Tennis & trips`, and `.ending-totals dt` renders every label of the block
in capitals, so the screen shows `TENNIS & TRIPS`: a Russian draft is read in capitals too.
`Капитал семьи` is a **current** balance-plus-holdings value, not career earnings. The
family's-share row and the still-owned row are no longer on the screen (the two rows marked
`⚙ removed` above stay as history). `Her account` stays conditional – it renders only when
positive – and the portfolio is always visible. Display ranks as `№{rank}`, but keep a distinct
unranked fallback.

## Conditional notes on the last page

| Condition | English | Russian draft | Markup constraint (live source, rounds 47/48) |
| --- | --- | --- | --- |
| completed academy earns | `Her academy stands – {built} of {total} stages built – and it earns {money} a week.` | `Её академия работает: построено {built} из {total} этапов, доход – {money} в неделю.` – ⚙ 11.10 в коде фраза собрана из кусков: ряд целиком не ложится на один ключ `QUESTION` | `{built}`, `{total}` and `{money}` each render inside their own `<b class="ending-fig">`; `{money}` is the compact form from $1M (`$40.6M`, locale-invariant by ruling, see RU-13D). The Russian cell must give each of the three its own marked segment. |
| academy begun, no earnings | `Her academy is begun – {built} of {total} stages built.` | `Строительство её академии началось: построено {built} из {total} этапов.` – ⚙ 11.10 в коде фраза собрана из кусков: ряд целиком не ложится на один ключ `QUESTION` | `{built}` and `{total}` each render inside their own `<b class="ending-fig">`; no money figure in this note. The Russian cell must give both their own marked segment. |
| lifetime advertising deal | `The {brand} deal never ran out – {money} a year, for life.` | `Договор с брендом «{brand}» не закончился вместе с карьерой: {money} в год пожизненно.` – ⚙ 11.10 в коде фраза собрана из кусков: ряд целиком не ложится на один ключ `QUESTION` | `{money}` renders inside `<b class="ending-fig">` and is compact from $1M. ⚠ The two words `for life` are a plain `<b>` (round 48 #5, his «make for life bold»): words, not a figure, so not `ending-fig`. The Russian cell's equivalent of `for life` (in this draft `пожизненно`) must be a marked bold segment; the cell has no markup slot for it today. Constraint noted only – his wording is untouched. |

The academy note has two fact shapes. Do not imply an unbuilt academy already earns money. The
lifetime deal's annual amount belongs to that signed deal; the ended career does not continue to
tick weekly payments. Both amount formatters must use shared money presentation over integer cents.

## The ending's own paragraph – the nine `ENDING_BLURB` sentences (10.10)

Owner 10.10, item 34: the nine sentences of `ENDING_BLURB` were written for the epilogue and drawn by
nothing, and he asked whether they could be built into the final screen. They are now: one paragraph
on the last page, directly under the ending's title (`She stopped after school`, and so on) and above
the line with the season and her age, at the notes' own size (14px). It is drawn for every ending, and
nothing else on the page changed. The placement and the wording both wait for his live look.

These are engine sentences read through a declared dynamic seat (`ending.blurb` in
`tools/i18n-seats.ts`), so each one is a catalog key by its English text. Every row below is `DRAFT`
and the **Russian column is empty on purpose: the words are his**. The English is the engine's,
character for character; nothing was reworded. Until a Russian cell is approved, a Russian session
shows the English sentence on that line, as it does for every unapproved row.

⚙ 11.10 (the owner's blanket ruling): seven of the nine cells are **filled by an agent**, `DRAFT`, his live edit follows ([RU-21](ru-engine-tails-2026-10.md)). The register is the epilogue's own – third person, past tense, the daughter `она`, nothing graded and nothing consoled («None of these may console»): the quiet verbs (`положила ракетку`, `ушла`), no adverb of feeling, and the English figure kept where it is a figure (`точка в конце фразы` for «the end of the sentence», `решила арифметика` for «the arithmetic did»). The vocabulary is RU-12C's (`следующий уровень`, `вершина`, `заявочный взнос`). **The `college` and the `natural` paragraphs are not translated** and stay `QUESTION`: the English of both disagrees with a line on the same page (the two disagreements listed below), so the owner's ruling of 10.10 holds the Russian until the English is settled; until then a Russian session shows the English sentence on those two lines.

| Surface | English | Russian draft |
| --- | --- | --- |
| epilogue paragraph, `stopped` | `School ended and the next ladder wanted more than the family had. She put the racket down there, and that is an ending, not a loss.` | `Школа закончилась, а следующий уровень требовал больше, чем было у семьи. Здесь она положила ракетку – это окончание, а не поражение.` |
| epilogue paragraph, `college` | `A scholarship covers its share, the family pays the rest, and a closed league pays no ranking points. The tour does not wait, and it does not remember.` | `Стипендия покрывает свою долю, остальное платит семья, а закрытая лига не приносит рейтинговых очков. Тур не ждёт – и не помнит.` · ⚙ 11.10 английский поправлен его словом («не возражаю, доделывай»): движок подтверждает долю семьи (resolveCollegeBill) |
| epilogue paragraph, `bankruptcy` | `Week after week below zero, and then a week with no entry fee in it. Nobody chose this one – the arithmetic did.` | `Неделя за неделей – ниже нуля, а потом пришла неделя, когда заплатить заявочный взнос было нечем. Никто этого не выбирал – решила арифметика.` |
| epilogue paragraph, `injury` | `The body had been telling the same story for years. This time it was not a layoff, it was the end of the sentence.` | `Годами тело говорило одно и то же. На этот раз это была не пауза в игре, а точка в конце фразы.` |
| epilogue paragraph, `natural` | `She was asked every off-season, and for years she agreed to one more. This year she did not.` | `Её спрашивали каждое межсезонье, и год за годом она соглашалась ещё на один. В этом году – нет.` · ⚙ 11.10 его слово: «she agreed» вместо «she said» (субъект её, рефрен остаётся родительским; «на моё усмотрение» – взят его же вариант с грамматическим to) |
| epilogue paragraph, `plateau` | `The rung above stayed where it was and so did she. Her own words for it were the plainest ones – she could not reach the top, so she went.` | `Ступень выше осталась там, где была, и она тоже. Её собственные слова были самыми простыми: до вершины ей не дотянуться, поэтому она ушла.` |
| epilogue paragraph, `peak` | `She was at the top of the sport the season she stopped. Nobody put the question to her and nobody had to – it was decided before anybody else heard about it.` | `В тот сезон, когда она остановилась, она была на вершине спорта. Никто не задавал ей этого вопроса, да и не нужно было: всё было решено раньше, чем об этом узнал кто-то ещё.` |
| epilogue paragraph, `fall` | `One season took most of what the season before it had built. Nobody asked her to stop and nobody talked her out of it.` | `Один сезон забрал большую часть того, что построил предыдущий. Никто не просил её остановиться – и никто не отговаривал.` |
| epilogue paragraph, `family` | `She had a child, and the months after it went by without an entry in them. No one asked her to choose – by spring the choice had long been made.` | `У неё родился ребёнок, и следующие месяцы прошли без единой заявки. Выбирать её никто не просил – к весне выбор давно был сделан.` |

The paragraph is centred, in a column about as wide as the title above it, so a Russian sentence that
runs longer than the English takes a line or two more on the page and nothing else moves (the page
scrolls). Three of the nine are drafts in the source – `peak` and `fall` (round 45) and `family`
(wave 8) – and are shown as they stand.

**Where a paragraph says again what the page already says** (for his live look; no sentence was changed
to answer any of this):

- `bankruptcy` – the fact line already reads «… weeks below zero – there was no next entry fee»; the
  paragraph's first sentence is the same two facts in prose.
- `peak` – the title is «She left at the top», and on a title-only exit the fact line reads «a title at
  the top of the sport, and she went the same season»; the paragraph opens «She was at the top of the
  sport the season she stopped».
- `plateau` – the fact line reads «… seasons and the table would not move»; the paragraph opens «The
  rung above stayed where it was and so did she».
- `stopped` – the fact line reads «she stopped when school ended, and nobody had to call it a failure»
  and the paragraph says it ended with school and is «an ending, not a loss», so the consolation that
  RU-12C already flags in the fact line is now said twice.
- `family`, `fall`, `injury` – the same fact in prose beside the same fact in numbers («51 weeks
  without a new entry», «#13 to #59 in one season», «N weeks already lost, and then this one»); mild.

Two are not repetition but disagreement with a line on the same page:

- `natural` – the page's own note (round 48, his voice change) reads «You said one more year N
  times.», and the paragraph says «she said one more». A career that said yes at the first asking
  (fact line: «the first time she was asked, she said yes») is also told «for years she said one more».
- `college` – the paragraph says «the money finally goes the other way», and the fact line under it
  says «the family pays its share of each year»; «the money goes the other way» is a claim the fork
  card dropped as one the engine did not honour (the note in `ForkDialog.vue` says so).

## Integration cautions

- `current.caption`, `current.why`, `current.fact`, and record `r.label` / `r.detail` are generated
  by `world/album.ts`, not by this component. A Russian shell around English engine pages is not
  localized. RU-12B will map those source rows.
- The portrait stage id is internal (`school`, `after-school`, `college`, `independent`). Use RU-05
  stage labels for a useful accessible name, never the raw English enum value.
- The takeover retains dialog focus and both forward paths; translation must not add Escape close
  to a blocking ending. Check button width, totals wrapping and screen-reader order on a phone.

## ⚙ 11.10 agent-authored (бланкет) – the epilogue notes that the template chains from fragments

⚙ 11.10 agent-authored under the blanket ruling; his live edit follows.

12 keys. The epilogue assembles three notes from fragments – the lifetime deal (`The {0} deal never ran out –` $X `a year,` **`for life`**), the academy (`Her academy stands –` N `of` M `stages built – and it earns` $X `a week.`) and the one-more-year refrain (`You said one more year` N `time.` / `times.`) – so the full sentences RU-12A drafted (and parked as `QUESTION`: «в коде фраза собрана из кусков») are cut in the same places and keep their words: the figure stands between two fragments and the word order of each Russian half is chosen so that it reads the same whatever the figure is. **The refrain is the one place where the Russian cannot inflect:** the code picks between exactly two keys (`time.` for 1, `times.` for the rest), and Russian needs three forms (`1 раз`, `2 раза`, `5 раз`), so the number moves to the end – `Сколько раз: 3.` – and both keys carry only the closing full stop. The two `ENDING_BLURB` paragraphs that are still `QUESTION` are not here.

| id | English | Russian |
| --- | --- | --- |
| RU21-ENS-01 | `Her academy is begun –` | `Строительство её академии началось: построено` |
| RU21-ENS-02 | `Her academy stands –` | `Её академия работает: построено` |
| RU21-ENS-03 | `The {0} deal never ran out –` | `Договор с брендом «{0}» не закончился вместе с карьерой:` |
| RU21-ENS-04 | `You said one more year` | `«Ещё один год», – говорили мы. Сколько раз:` |
| RU21-ENS-05 | `a week.` | `в неделю.` |
| RU21-ENS-06 | `a year,` | `в год,` |
| RU21-ENS-07 | `for life` | `пожизненно` |
| RU21-ENS-08 | `of` | `из` |
| RU21-ENS-09 | `stages built – and it earns` | `этапов, доход –` |
| RU21-ENS-10 | `stages built.` | `этапов.` |
| RU21-ENS-11 | `time.` | `.` |
| RU21-ENS-12 | `times.` | `.` |
