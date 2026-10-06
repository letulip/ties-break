---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-12A – Epilogue screen and hand-off controls

Source: `src/components/EndingScreen.vue`. This is the UI frame around engine-authored album
pages and record rows; it does **not** translate those page corpora (next RU-12 packet). All
Russian lines are `DRAFT`, except established shared terms `Дом` and `Рейтинг`.

| Surface | English | Russian draft |
| --- | --- | --- |
| dialog accessible name | `Epilogue` | `Эпилог карьеры` |
| record heading and link | `The whole record` | `Вся история` |
| record return | `Back to the album` | `Вернуться к альбому` |
| record season age | `she was {ageYears}` | `ей было {ageYears} {год/года/лет}` |
| empty record | `Nothing was ever written down. That happens.` | `Здесь не осталось записей. Бывает и так.` |
| ordinary album heading | `The album` | `Альбом` |
| final page heading | `The last page` | `Последняя страница` |
| portrait alt | `Aged {stage}` | `Портрет: возрастной этап «{stageLocalized}»` |
| previous/next | `Back` / `Next` | `Назад` / `Дальше` |
| family's prize share | `Family's share` | `Доля семьи` |
| permanent outlay | `Spent` | `Потрачено` |
| daughter's account | `Her account` | `Её счёт` |
| still owned holdings | `Still owned` | `Осталось в собственности` |
| current portfolio value | `Family's portfolio` | `Капитал семьи` |
| seasons | `Seasons` | `Сезонов` |
| best rank | `Best rank` | `Высшее место в рейтинге` |
| titles | `Titles` | `Титулов` |
| one-more-year refrain | `She said one more year {count} time/times.` | `«Ещё один год», — говорила она. Так было {count} {раз/раза/раз}.` |
| resume college fallback | `Another year –` | `Ещё один год —` |
| new unrelated childhood | `Raise another` | `Вырастить другую` |
| dynasty, daughter lived during tour | `Raise her daughter` | `Вырастить её дочь` |
| dynasty, daughter born after career | `A daughter came later` | `Позже у неё родилась дочь` |

`Вырастить другую` means a **new, unrelated** career routed to the childhood opening, not an
instant thirteen-year-old and not this player's granddaughter. This label may read brusque in
Russian. Alternative for owner read: `Начать новую историю`; it loses the English family motif
but better describes the action. Do not silently substitute one for the other: the two adjacent
dynasty actions must stay distinguishable. The dynasty variants are always available on a final
ending, regardless of whether a child was born during the played career; availability does not
encode parental merit.

The `Spent` figure excludes still-owned assets; `Капитал семьи` is a **current** balance-plus-
holdings value, not career earnings. `Доля семьи` is the family's prize share, not all prize money
won by the daughter. Preserve conditional visibility of `Her account` and `Still owned` and
the always-visible portfolio. Display ranks as `№{rank}`, but keep a distinct unranked fallback.

## Conditional notes on the last page

| Condition | English | Russian draft |
| --- | --- | --- |
| completed academy earns | `Her academy stands – {built} of {total} stages built – and it earns {money} a week.` | `Её академия работает: построено {built} из {total} этапов, доход — {money} в неделю.` |
| academy begun, no earnings | `Her academy is begun – {built} of {total} stages built.` | `Строительство её академии началось: построено {built} из {total} этапов.` |
| lifetime advertising deal | `The {brand} deal never ran out – {money} a year, for life.` | `Договор с брендом «{brand}» не закончился вместе с карьерой: {money} в год пожизненно.` |

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
