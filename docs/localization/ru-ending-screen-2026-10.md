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
| portrait alt | `Aged {stage}` | `Портрет: возрастной этап «{stageLocalized}»` |
| real album door | `View the album` | `Посмотреть альбом` |
| visible test export | `Export save (dev)` | `Экспортировать сохранение (тест)` |
| family's prize share | `Family's share` | `Доля семьи` · ⚙ removed 07.10 (round 48 #3) |
| permanent outlay | `Tennis & trips` | `Теннис и поездки` · `APPROVED` 08.10 (his own wording; `docs/decisions.md`) |
| daughter's account | `Her account` | `Её счёт` |
| still owned holdings | `Still owned` | `Осталось в собственности` · ⚙ removed 07.10 (round 47 #6) |
| current portfolio value | `Family's portfolio` | `Капитал семьи` |
| seasons | `Seasons` | `Сезонов` |
| best rank | `Best rank` | `Высшее место в рейтинге` |
| titles | `Titles` | `Титулов` |
| one-more-year refrain | `You said one more year {count} time/times.` | `«Ещё один год», – говорили мы. Так было {count, plural, one {{count} раз} few {{count} раза} many {{count} раз} other {{count} раз}}.` |
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
| completed academy earns | `Her academy stands – {built} of {total} stages built – and it earns {money} a week.` | `Её академия работает: построено {built} из {total} этапов, доход – {money} в неделю.` | `{built}`, `{total}` and `{money}` each render inside their own `<b class="ending-fig">`; `{money}` is the compact form from $1M (`$40.6M`, locale-invariant by ruling, see RU-13D). The Russian cell must give each of the three its own marked segment. |
| academy begun, no earnings | `Her academy is begun – {built} of {total} stages built.` | `Строительство её академии началось: построено {built} из {total} этапов.` | `{built}` and `{total}` each render inside their own `<b class="ending-fig">`; no money figure in this note. The Russian cell must give both their own marked segment. |
| lifetime advertising deal | `The {brand} deal never ran out – {money} a year, for life.` | `Договор с брендом «{brand}» не закончился вместе с карьерой: {money} в год пожизненно.` | `{money}` renders inside `<b class="ending-fig">` and is compact from $1M. ⚠ The two words `for life` are a plain `<b>` (round 48 #5, his «make for life bold»): words, not a figure, so not `ending-fig`. The Russian cell's equivalent of `for life` (in this draft `пожизненно`) must be a marked bold segment; the cell has no markup slot for it today. Constraint noted only – his wording is untouched. |

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

| Surface | English | Russian draft |
| --- | --- | --- |
| epilogue paragraph, `stopped` | `School ended and the next ladder wanted more than the family had. She put the racket down there, and that is an ending, not a loss.` | |
| epilogue paragraph, `college` | `A scholarship, a closed league that pays no ranking points, and a stretch of years in which the money finally goes the other way. The tour does not wait, and it does not remember.` | |
| epilogue paragraph, `bankruptcy` | `Week after week below zero, and then a week with no entry fee in it. Nobody chose this one – the arithmetic did.` | |
| epilogue paragraph, `injury` | `The body had been telling the same story for years. This time it was not a layoff, it was the end of the sentence.` | |
| epilogue paragraph, `natural` | `She was asked every off-season and for years she said one more. This year she did not.` | |
| epilogue paragraph, `plateau` | `The rung above stayed where it was and so did she. Her own words for it were the plainest ones – she could not reach the top, so she went.` | |
| epilogue paragraph, `peak` | `She was at the top of the sport the season she stopped. Nobody put the question to her and nobody had to – it was decided before anybody else heard about it.` | |
| epilogue paragraph, `fall` | `One season took most of what the season before it had built. Nobody asked her to stop and nobody talked her out of it.` | |
| epilogue paragraph, `family` | `She had a child, and the months after it went by without an entry in them. No one asked her to choose – by spring the choice had long been made.` | |

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
