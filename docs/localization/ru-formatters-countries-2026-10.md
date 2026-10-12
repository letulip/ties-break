---
type: spec
status: draft
area: localization
canonical: false
last-reviewed: 2026-10-06
---

# RU-13D – даты, числа, деньги и страны

Все строки ниже – `DRAFT`. Источники: `src/shared/dates.ts`, `src/shared/money.ts`,
`src/composables/countries.ts`, `src/composables/identityCopy.ts` и их вызовы в интерфейсе.
Это изменение отображения: абсолютная неделя, календарная арифметика, суммы в центах и коды
стран в сохранении не меняются.

> 07.10, [RU-18](ru-main-delta-2-2026-10.md): one row below is now `APPROVED` (the short year,
> spec §9.9d), and the owner's money-and-numbers ruling narrows this batch to dates, week labels
> and countries – see the ruling note after the money section.

## Даты и недели

| Английская форма | Русская форма | Условие |
| --- | --- | --- |
| `W27 2033` | `Неделя 27 · 2033` | Полная шапка Home (RU-03). |
| `W14 '31` | `Нед. 14 · ’31` | Узкая метка, как в RU-03; проверить ширину и ясность года на телефоне. `APPROVED` 07.10 – the short year stands (spec §9.9d; his «а чем плох короткий год?»). |
| `Jan '31` | `янв. ’31` – ⚙ 11.10 формат даты: форматтера в реестре ещё нет – ряд ждёт его, не ключ каталога `QUESTION` | Месячная ось графика. |
| `Jun 3 – Jun 9` | `3–9 июня` – ⚙ 11.10 формат даты: форматтера в реестре ещё нет – ряд ждёт его, не ключ каталога `QUESTION` | Одна неделя внутри месяца, год уже виден рядом. |
| `Jan 27 – Feb 2` | `27 января – 2 февраля` – ⚙ 11.10 формат даты: форматтера в реестре ещё нет – ряд ждёт его, не ключ каталога `QUESTION` | Неделя пересекает месяцы. |
| `W27 2033 · Jun 3 – Jun 9` | `Неделя 27 · 2033 · 3–9 июня` – ⚙ 11.10 формат даты: форматтера в реестре ещё нет – ряд ждёт его, не ключ каталога `QUESTION` | `weekDateLine` собирается из тех же двух локализованных частей. |
| `Jan 6–12, 2031` | `6–12 января 2031 года` – ⚙ 11.10 формат даты: форматтера в реестре ещё нет – ряд ждёт его, не ключ каталога `QUESTION` | Самостоятельный диапазон. |
| `Jan 27 – Feb 2, 2031` | `27 января – 2 февраля 2031 года` – ⚙ 11.10 формат даты: форматтера в реестре ещё нет – ряд ждёт его, не ключ каталога `QUESTION` | Диапазон через границу месяцев. |
| `Dec 29, 2031 – Jan 4, 2032` | `29 декабря 2031 – 4 января 2032 года` – ⚙ 11.10 формат даты: форматтера в реестре ещё нет – ряд ждёт его, не ключ каталога `QUESTION` | Оба года обязательны. |
| `12 June` | `12 июня` – ⚙ 11.10 формат даты: форматтера в реестре ещё нет – ряд ждёт его, не ключ каталога `QUESTION` | День рождения: без года и номера недели. |
| `W1-10` | `Нед. 1–10` – ⚙ 12.10 r49 №2 ф2: реестр `dates.seasonWeekRange` (tools/i18n-formats.ts), читает дисплейный модуль src/i18n/formats.ts – формат, не ключ каталога | Номера недель внутри сезона, не абсолютные недели. |
| `(last week)` | `(последняя неделя)` – ⚙ 12.10 r49 №2 ф2: ключ каталога – ветка left <= 0 в weeksLeftBracket (src/i18n/dates.ts) | Никогда не `(0 недель)`. |
| `(1 week left)` | `(осталась 1 неделя)` – ⚙ 12.10 r49 №2 ф2: ключ каталога – ветка left === 1 в weeksLeftBracket (src/i18n/dates.ts); его образец, дословно | Число меняет существительное и глагол. |
| `({weeks} weeks left)` | `{weeks, plural, one {(осталась {weeks} неделя)} few {(осталось {weeks} недели)} many {(осталось {weeks} недель)} other {(осталось {weeks} недели)}}` – ⚙ 12.10 r49 №2 ф2: ICU по его образцам «(осталась 1 неделя)» / «(осталось 14 недель)»; формы few/other дописаны агентом под бланкет 11.10 | Число меняет существительное и глагол. |

Кандидат RU-06 `14-я неделя · 2031` предварительный; основной вариант для реализации –
RU-03 F01–F04 и таблица выше. До одобрения владельца это не окончательный выбор.

Для отдельного выбора месяца – `январь, февраль, март, апрель, май, июнь, июль, август,
сентябрь, октябрь, ноябрь, декабрь`. После числа – `января, февраля, марта, апреля, мая,
июня, июля, августа, сентября, октября, ноября, декабря`. Ось может использовать
`янв., февр., март, апр., май, июнь, июль, авг., сент., окт., нояб., дек.`.
`OnboardingWizard` и `PrologueCard` сейчас собирают `MONTHS[month] + day` в английском порядке;
русская сборка нужна `день + месяц в родительном`, а не перевод одного массива.

## Деньги и прочие числа

Доллар остаётся долларом; локализация не пересчитывает экономику в рубли.

| Исходная форма | Русская форма | Правило |
| --- | --- | --- |
| `$1,234` | `$1 234` | Неразрывный разделитель тысяч; валюта перед числом по стилю проекта. |
| `-$1,234` / `+$1,234` | `−$1 234` / `+$1 234` | Единый знак; если шрифт/копирование не поддерживают `−`, допустим последовательный ASCII `-`. |
| `$0` / `+$0` | `$0` / `+$0` | Сохранить округление и защиту от отрицательного нуля. |
| `entry $40` | `взнос – $40` | Слово – часть фразы, не денежного форматтера. |
| `no entry fee` | `без вступительного взноса` | Не `бесплатно`: поездка оплачивается отдельно. |
| `1,234` зрителей / единиц | `1 234` | Один числовой форматтер для отображения. |
| `28%` | `28 %` | Неразрывный пробел; проверить ширину в тесных карточках. |
| `#14` (рейтинг) | `№ 14` | По RU-07, но проверить контекст международных WTA/ITF обозначений. |

`formatCents` и `formatCentsSigned` принимают целые **центы** и показывают целые доллары.
Сейчас они жёстко используют `en-US`; `MoreScreen.vue:194` использует `en-GB`,
`TournamentFlow.vue` и `NextTournamentPanel.vue` отдельно группируют зрителей через `en-US`,
а `src/engine/world/college.ts:1235` отдельно форматирует долларовую сумму. Технической
ветке нужна единая локальная граница **отображения**, без изменения cents в движке и `.tsave`.

## Ruling note – 07.10.2026 (RU-18 D18): money and numbers keep one form

The owner ruled on 07.10 (spec §9.6 and §9.8; `docs/decisions.md`): «я бы доллары оставил и не
заморачивался» and, on the compact figures, «я бы оставил везде одно, как с именами собственными».
Money and numbers keep **one** form in every locale: `$12,500.40` and `$40.6M` are
locale-invariant by ruling, and `Intl` is not used for money. This batch narrows to **dates, week
labels and countries**.

| Source form (`src/shared/money.ts`) | Call sites since round 47 | Russian row |
| --- | --- | --- |
| `formatCentsCompact` – `$40.6M` from one million up | `EndingScreen.vue` 5, `SeasonSummaryDialog.vue` 1 | none – locale-invariant by ruling |
| `formatCentsSignedCompact` – `+$2.1M`, `-$5.0M` | `SeasonSummaryDialog.vue` 7 | none – locale-invariant by ruling |

That is 13 call sites; the pair has no translation row and needs none, so D18 closes with this
note. The rows of the table above that change the **form** of an amount or a number (`$1,234` to
`$1 234`, the signed pair, `1,234` to `1 234`, `28%` to `28 %`) are superseded by the same ruling:
they stay as the editorial history of the question and compile nowhere, and the `в обеих формах`
half of the money check in the integration list below is moot (its zero-entry-fee half stands).
Not covered by the ruling, so left as drafted: the word rows (`взнос`, `без вступительного
взноса`) and the rank marker `№ 14`.

## Все 24 страны текущего выбора

Код страны и флаг не переводятся. Меняется только подпись в именительном падеже.

| Код | English | Русский | Код | English | Русский |
| --- | --- | --- | --- | --- | --- |
| US | United States | США | GB | United Kingdom | Великобритания |
| FR | France | Франция | ES | Spain | Испания |
| IT | Italy | Италия | DE | Germany | Германия |
| RU | Russia | Россия | RS | Serbia | Сербия |
| CH | Switzerland | Швейцария | CZ | Czechia | Чехия |
| PL | Poland | Польша | UA | Ukraine | Украина |
| KZ | Kazakhstan | Казахстан | BY | Belarus | Беларусь |
| AU | Australia | Австралия | JP | Japan | Япония |
| CN | China | Китай | KR | South Korea | Южная Корея |
| IN | India | Индия | BR | Brazil | Бразилия |
| AR | Argentina | Аргентина | CA | Canada | Канада |
| NL | Netherlands | Нидерланды | SE | Sweden | Швеция |

Шаблон `из {country}` нельзя составлять из этих форм: `из США`, но `из Франции` и
`из Нидерландов`. Нужен падежный каталог либо нейтральная конструкция `Страна: Франция`.
Не менять `US`/`GB` в save/protocol; неизвестный код из старого сохранения честно остаётся
кодом, если для него нет локализованного названия.

## Проверка при интеграции

- Даты сверить в Home, календаре, письмах, финансах и альбоме, включая 31 декабря / 1 января.
- Склонения проверить на 1, 2, 5, 11, 21, 22, 25 для `неделя`, `год`, `месяц`, `матч`, `очко`.
- Деньги проверить на -49, 0, 49, 50, 150, 123450 центах в обеих формах; нулевой взнос
  турнира должен оставаться именно отсутствием вступительного взноса.
- Все 24 названия проверить в выборе страны, профиле, шапке, More и турнирах.
- Отображение не вправе менять `week`, `fundsCents`, `country`, RNG или `.tsave`.

## ⚙ 11.10 agent-authored (бланкет) – the twelve months of the birthday pickers

⚙ 11.10 agent-authored under the blanket ruling; his live edit follows.

24 keys of `identityCopy.ts`: the twelve month names (nominative, for the month picker) and the twelve `Month {day}` forms, which put the day first and the month in the genitive (`{day} июня`) as RU-13D asks. The picker shows the capitalised nominative; the lowercase list in this document's prose is the same twelve words in running text.

| id | English | Russian |
| --- | --- | --- |
| RU21-FMT-01 | `April` | `Апрель` |
| RU21-FMT-02 | `April {day}` | `{day} апреля` |
| RU21-FMT-03 | `August` | `Август` |
| RU21-FMT-04 | `August {day}` | `{day} августа` |
| RU21-FMT-05 | `December` | `Декабрь` |
| RU21-FMT-06 | `December {day}` | `{day} декабря` |
| RU21-FMT-07 | `February` | `Февраль` |
| RU21-FMT-08 | `February {day}` | `{day} февраля` |
| RU21-FMT-09 | `January` | `Январь` |
| RU21-FMT-10 | `January {day}` | `{day} января` |
| RU21-FMT-11 | `July` | `Июль` |
| RU21-FMT-12 | `July {day}` | `{day} июля` |
| RU21-FMT-13 | `June` | `Июнь` |
| RU21-FMT-14 | `June {day}` | `{day} июня` |
| RU21-FMT-15 | `March` | `Март` |
| RU21-FMT-16 | `March {day}` | `{day} марта` |
| RU21-FMT-17 | `May` | `Май` · ⚙ 12.10 r49 №2: the hint `identityCopy.ts` names the month-picker's own key – «May» is the one month whose axis twin (`mon\|May`, the r49 №2 table below) strips to the same English, so the bare row has to say whose surface it is |
| RU21-FMT-18 | `May {day}` | `{day} мая` |
| RU21-FMT-19 | `November` | `Ноябрь` |
| RU21-FMT-20 | `November {day}` | `{day} ноября` |
| RU21-FMT-21 | `October` | `Октябрь` |
| RU21-FMT-22 | `October {day}` | `{day} октября` |
| RU21-FMT-23 | `September` | `Сентябрь` |
| RU21-FMT-24 | `September {day}` | `{day} сентября` |

## ⚙ 12.10 agent-authored (r49 №2) – the display module's own keys

⚙ 12.10 agent-authored under the blanket ruling; his live edit follows.

Round-49 item 2 (phase 1) built the date rows' missing formatter: `src/i18n/dates.ts`, the display
twin of `shared/dates.ts` – under `en` it delegates byte-for-byte, under `ru` it assembles the forms
of the table above from `weekSpanParts` (numbers, never a parsed string). The `⚙ 11.10 формат даты`
rows above are therefore implemented, not compiled: their English column stays a formatter OUTPUT and
never becomes a catalog key (tests/component/i18n-l2-11 pins that). What DOES compile is below – the
genitive months were already RU21-FMT-01..24; these are the three assemblies that had no key. The
twelve axis abbreviations are the table's own list (:после числа / ось), verbatim; the tag `mon|`
keeps the three-letter English token a key spelling rather than a word of any reader class.

| id | English | Russian |
| --- | --- | --- |
| R49N2-FMT-01 | `mon\|Jan` | `янв.` |
| R49N2-FMT-02 | `mon\|Feb` | `февр.` |
| R49N2-FMT-03 | `mon\|Mar` | `март` |
| R49N2-FMT-04 | `mon\|Apr` | `апр.` |
| R49N2-FMT-05 | `mon\|May` | `май` |
| R49N2-FMT-06 | `mon\|Jun` | `июнь` |
| R49N2-FMT-07 | `mon\|Jul` | `июль` |
| R49N2-FMT-08 | `mon\|Aug` | `авг.` |
| R49N2-FMT-09 | `mon\|Sep` | `сент.` |
| R49N2-FMT-10 | `mon\|Oct` | `окт.` |
| R49N2-FMT-11 | `mon\|Nov` | `нояб.` |
| R49N2-FMT-12 | `mon\|Dec` | `дек.` |
| R49N2-FMT-13 | `W{week} {year}` | `Неделя {week} · {year}` – ⚙ 12.10 r49 №2 ф2: ключ ушёл в реестр `dates.weekYearLabel` – один дом на факт; `weekDateLine` берёт половину недели у `weekYearLabel` (src/i18n/formats.ts), ключа больше нет в каталоге `QUESTION` |
| R49N2-FMT-14 | `{span}, {year}` | `{span} {year} года` |

`W{week} {year}` WAS the week half of `weekDateLine` (the table's «Неделя 27 · 2033 · 3–9 июня» row) –
⚙ 12.10 r49 №2 ф2 retired it: phase 2 wired the registry (`src/i18n/formats.ts`, the one reader of
`formats.ru.json`), so the week half now rides the registry's `dates.weekYearLabel` like
`weekYearLabel` itself, one home per fact. The week-only labels (`weekLabel`, `weekYearLabel`,
`seasonWeekRange`) are registry patterns; `weeksLeftBracket` alone stays on catalog keys (the three
bracket rows of the table above), because a one-sample pattern cannot pluralise. `{span},
{year}` is `weekRange`'s year tail – exactly how the English composes in all three branches – so
«года» is the translator's word, never typed in code; the cross-year span carries its first year
bare inside `{span}`, as the table's «29 декабря 2031 – 4 января 2032 года» row spells.
