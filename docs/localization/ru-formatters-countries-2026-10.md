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
| `Jan '31` | `янв. ’31` | Месячная ось графика. |
| `Jun 3 – Jun 9` | `3–9 июня` | Одна неделя внутри месяца, год уже виден рядом. |
| `Jan 27 – Feb 2` | `27 января – 2 февраля` | Неделя пересекает месяцы. |
| `W27 2033 · Jun 3 – Jun 9` | `Неделя 27 · 2033 · 3–9 июня` | `weekDateLine` собирается из тех же двух локализованных частей. |
| `Jan 6–12, 2031` | `6–12 января 2031 года` | Самостоятельный диапазон. |
| `Jan 27 – Feb 2, 2031` | `27 января – 2 февраля 2031 года` | Диапазон через границу месяцев. |
| `Dec 29, 2031 – Jan 4, 2032` | `29 декабря 2031 – 4 января 2032 года` | Оба года обязательны. |
| `12 June` | `12 июня` | День рождения: без года и номера недели. |
| `W1-10` | `Нед. 1–10` | Номера недель внутри сезона, не абсолютные недели. |
| `(last week)` | `(последняя неделя)` | Никогда не `(0 недель)`. |
| `(1 week left)` / `(14 weeks left)` | `(осталась 1 неделя)` / `(осталось 14 недель)` | Число меняет существительное и глагол. |

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
