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
| record season age | `she was {ageYears}` | `ей было {ageYears} {год/года/лет}` |
| empty record | `Nothing was ever written down. That happens.` | `Здесь не осталось записей. Бывает и так.` |
| final page heading | `The last page` | `Последняя страница` |
| portrait alt | `Aged {stage}` | `Портрет: возрастной этап «{stageLocalized}»` |
| real album door | `View the album` | `Посмотреть альбом` |
| visible test export | `Export save (dev)` | `Экспортировать сохранение (тест)` |
| family's prize share | `Family's share` | `Доля семьи` · ⚙ removed 07.10 (round 48 #3) |
| permanent outlay | `Tennis & trips` | `QUESTION` – awaiting his draft: renamed in round 48 #3, the retired draft translated the old label |
| daughter's account | `Her account` | `Её счёт` |
| still owned holdings | `Still owned` | `Осталось в собственности` · ⚙ removed 07.10 (round 47 #6) |
| current portfolio value | `Family's portfolio` | `Капитал семьи` |
| seasons | `Seasons` | `Сезонов` |
| best rank | `Best rank` | `Высшее место в рейтинге` |
| titles | `Titles` | `Титулов` |
| one-more-year refrain | `You said one more year {count} time/times.` | `«Ещё один год», – говорили мы. Так было {count} {раз/раза/раз}.` |
| resume college fallback | `Another year –` | `Ещё один год –` |
| new unrelated childhood | `Raise another` | `Новая история` · `APPROVED` 07.10 (his own wording, spec §9.9a) |
| dynasty, daughter lived during tour | `Raise her daughter` | `Вырастить её дочь` |
| dynasty, child born after career | `A child came later` | `QUESTION` – awaiting his draft: renamed in round 48 #6 (his «child»), the retired draft translated the old label |

`Новая история` is the owner's own wording (ruled 07.10, spec §9.9a, in place of both drafted
options – the retired pair is quoted in RU-18). It names a **new, unrelated** career routed to the
childhood opening, not an instant thirteen-year-old and not this player's granddaughter. The two
adjacent dynasty actions must stay distinguishable from it. The dynasty variants are always
available on a final ending, regardless of whether a child was born during the played career;
availability does not encode parental merit.

`A child came later` is gender-neutral by the owner's own word (round 48 #6: «child» is better;
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

## Integration cautions

- `current.caption`, `current.why`, `current.fact`, and record `r.label` / `r.detail` are generated
  by `world/album.ts`, not by this component. A Russian shell around English engine pages is not
  localized. RU-12B will map those source rows.
- The portrait stage id is internal (`school`, `after-school`, `college`, `independent`). Use RU-05
  stage labels for a useful accessible name, never the raw English enum value.
- The takeover retains dialog focus and both forward paths; translation must not add Escape close
  to a blocking ending. Check button width, totals wrapping and screen-reader order on a phone.
